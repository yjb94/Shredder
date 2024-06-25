import { SkRect, Vector, vec } from "@shopify/react-native-skia";

export const generateTrianglePointsAndIndices = (
  rct: SkRect,
  triangleNumberHeight: number
) => {
  const vertices: Vector[] = [];
  const textures: Vector[] = [];
  const indices: number[] = [];

  // Calculate the size of the triangles based on the given number
  const triangleWidth = rct.width;
  const triangleHeight = rct.height / triangleNumberHeight;

  // Generate the list of points
  for (let i = 0; i <= triangleNumberHeight; i++) {
    for (let j = 0; j <= 1; j++) {
      const point: Vector = vec(
        rct.x + j * triangleWidth,
        rct.y + i * triangleHeight
      );
      textures.push(point);
      vertices.push(point);
    }
  }

  // Generate the list of triangle indices
  for (let i = 0; i < triangleNumberHeight; i++) {
    const topLeftIndex = i * 2;
    const topRightIndex = topLeftIndex + 1;
    const bottomLeftIndex = topLeftIndex + 2;
    const bottomRightIndex = bottomLeftIndex + 1;

    // Create two triangles for each square and add their indices to the list
    indices.push(topLeftIndex, topRightIndex, bottomLeftIndex);
    indices.push(bottomLeftIndex, topRightIndex, bottomRightIndex);
  }

  return { vertices, indices, textures };
};

export const generateTrianglePointsAndIndicesVertical = (
  rct: SkRect,
  triangleNumberWidth: number
) => {
  const vertices: Vector[] = [];
  const textures: Vector[] = [];
  const indices: number[] = [];

  // Calculate the size of the triangles based on the given number
  const triangleWidth = rct.width / triangleNumberWidth;
  const triangleHeight = rct.height;

  // Generate the list of points
  for (let j = 0; j <= triangleNumberWidth; j++) {
    for (let i = 0; i <= 1; i++) {
      const point: Vector = vec(
        rct.x + j * triangleWidth,
        rct.y + i * triangleHeight
      );
      textures.push(point);
      vertices.push(point);
    }
  }

  // Generate the list of triangle indices
  for (let j = 0; j < triangleNumberWidth; j++) {
    const leftTopIndex = j * 2;
    const leftBottomIndex = leftTopIndex + 1;
    const rightTopIndex = leftTopIndex + 2;
    const rightBottomIndex = rightTopIndex + 1;

    // Create two triangles for each square and add their indices to the list
    indices.push(leftTopIndex, rightTopIndex, leftBottomIndex);
    indices.push(leftBottomIndex, rightTopIndex, rightBottomIndex);
  }

  return { vertices, indices, textures };
};
