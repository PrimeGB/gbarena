import {
  renderSocialPreview,
  socialImageAlt,
  socialImageSize,
} from "./components/SocialPreview";

export const alt = socialImageAlt;
export const size = socialImageSize;
export const contentType = "image/png";

export default function TwitterImage() {
  return renderSocialPreview();
}
