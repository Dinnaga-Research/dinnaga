// ABOUTME: Cell and material types shared by the head renderer and the planet-and-stars scene.
// ABOUTME: Kept apart so the two modules do not import each other.

export const Mat = {
  None: 0,
  Skin: 1,
  Eye: 2,
  Pupil: 3,
  Mouth: 4,
  Teeth: 5,
  Planet: 6,
} as const;
export type Mat = (typeof Mat)[keyof typeof Mat];

export interface Cell {
  shade: number; // 0..1 lit brightness
  mat: Mat;
}
