import { ogSize, renderOg } from "./_og";

export const alt = "João Panucci — Software Developer · JoãoOS";
export const size = ogSize;
export const contentType = "image/png";

export default function Image() {
  return renderOg();
}
