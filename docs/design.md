# トポロジーベース・グラフエディタ 詳細アーキテクチャ設計書 (v2.0)

## 1. プロダクト・ビジョンとコア・パラダイム

本エディタは、「図形を配置する」のではなく、**「線（トポロジー）を紡ぐことで意味を定義する」**ツールである。

1. **トポロジーの維持**: 頂点（Vertex）を独立した実体とし、複数の線がこれを共有する。
2. **操作の最小化**: ベジェハンドルを廃止。Catmull-Rom スプラインによる自動滑らか化。
3. **指向性の導入**: 線はトポロジー的な接続情報に加え、オプションとして「向き（Arrow）」を持つことができる。
4. **単方向データフロー**: State -> Geometry Engine -> View の純粋な流れ。

## 2. アーキテクチャ概略図

```
[ User Interaction ]
       |
       v
+----------------------------+
|  Interaction Controller    | -- (Mouse/Touch Events)
|  (React Event Handlers)     |
+--------------+-------------+
               | Dispatch Action (Move, Merge, SetArrow)
               v
+--------------+-------------------------------------------+
|  State Management (Zustand / Redux)                      |
|                                                          |
|  [ Normalized Store ]                                    |
|  {                                                       |
|    vertices: { "v1": {x, y, type}, "v2": {...} },        |
|    lines:    { "l1": {vertexIds: ["v1", "v2"], arrow} }, |
|    objects:  { "o1": {vertexIds: [...], color} }         |
|  }                                                       |
+--------------+-------------------------------------------+
               | New AppState (Immutable Update)
               v
+--------------+-------------------------------------------+
|  Geometry Engine (Pure Functions)                        |
|                                                          |
|  1. Path Gen (Catmull-Rom Spline)                         |
|  2. Arrow Calc (Tangent Vector & Angle)                   |
|  3. Cycle Detection (DFS -> Object Promotion)             |
+--------------+-------------------------------------------+
               | Computed Render Data (SVG Path Strings, Markers)
               v
+--------------+-------------+
|  Rendering Engine          |
|  (React + SVG)             | -- <path d="..." marker-end="..." />
+----------------------------+
```

## 3. データモデル設計（正規化された State）

頂点、線、オブジェクト（閉路）を分離して管理する。

### 3.1. 頂点 (Vertex)

```ts
type ConnectionType = 'sharp' | 'smooth';

interface Vertex {
  id: string;
  x: number;
  y: number;
  connectionType: ConnectionType;
}
```

### 3.2. 線 (Line) - ★矢印プロパティの追加

```ts
type ArrowType = 'none' | 'forward' | 'backward' | 'both';

interface Line {
  id: string;
  type: 'line';
  vertexIds: string[]; // Vertex IDの配列

  // スタイル情報
  strokeColor: string;
  strokeWidth: number;
  strokeDasharray?: string;

  // 指向性情報
  arrowType: ArrowType; // ★ 線の始点・終点に矢印を表示するか
}
```

### 3.3. 閉じた図形 (ObjectShape)

```ts
interface ObjectShape {
  id: string;
  type: 'object';
  vertexIds: string[]; // 閉路を構成する頂点順
  fillColor: string;
  text: string;
  // ...その他見た目・文字情報
}
```

## 4. システムアーキテクチャ詳細

### 4.1. Geometry Engine (幾何計算層)

AppStateを受け取り、描画用データを算出する。

1. **パス計算**: vertexIds と connectionType から Catmull-Rom スプラインの SVG パスを生成。
2. **★矢印角度計算**:
   - 始点/終点における「接線ベクトル」を算出。
   - ![][image1] と ![][image2] の座標から ![][image3] を計算し、矢印の回転角を決定。
3. **重心計算**: ObjectShape のテキスト配置用座標を算出。

### 4.2. Rendering Engine (描画層)

1. **SVG Markers**: 矢印は SVG の `<marker>` 要素として定義。
2. **Dynamic Rendering**: Line.arrowType に基づき、marker-start または marker-end 属性をパスに付与。

## 5. コア・アルゴリズム設計

### 5.1. 矢印の動的生成アルゴリズム

矢印の形状を固定せず、線の太さや角度に自動追従させる。

* **マーカー定義**:
  ```svg
  <marker id="arrowhead" markerWidth="10" markerHeight="7"
          refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" />
  </marker>
  ```

* **衝突回避**: 頂点が別の線と共有（スナップ）されている場合、共有頂点においては矢印をわずかにオフセットさせるロジックを Geometry Engine に含める。

### 5.2. 閉路検出とオブジェクト昇格

1. **グラフ構築**: vertices をノード、lines をエッジとする隣接リストを作成。
2. **DFS (深さ優先探索)**: 新たな結合が発生した際、最小閉路を探索。
3. **昇格**: 閉路が見つかった場合、その領域を塗る ObjectShape を生成。

### 5.3. スナップと頂点の融合

* 二つの頂点が一定距離（THRESHOLD）に近づいた際、一方のIDに統合。  
* 統合後、全 Line.vertexIds 内の旧IDを新IDへ置換。

## 6. レイヤー間 API 仕様 (Actions)

```ts
// 矢印操作の追加
type SetArrowTypePayload = { lineId: string; arrowType: ArrowType };

// 既存アクション
type MoveVertexPayload = { vertexId: string; x: number; y: number };
type MergeVerticesPayload = { keptId: string; removedId: string };
```

## 7. エッジケースと UX 上の制約

* **矢印の向きの自動反転**: ユーザーが線を引く方向に依存せず、後から UI で「向き」をトグルできる必要がある。  
* **分岐点での矢印**: 一つの頂点から複数の矢印が出る場合、矢印同士が重ならないよう refX を動的に調整する。

## 8. 開発ロードマップ

1. **Phase 1**: 頂点・線の正規化Stateと基本描画。  
2. **Phase 2**: **矢印の計算ロジック（接線ベクトル算出）の実装。**  
3. **Phase 3**: スナップ・マージ処理の実装。  
4. **Phase 4**: DFSによる閉路検出とObject生成。  
5. **Phase 5**: インタラクティブな矢印方向切り替え機能。
