import type { Metadata } from "next";

function buildMiniappEmbed(imageUrl: string, imageRelativePath: string, title: string, baseUrl: string): string {
  const miniappBaseUrl = getMiniappBaseUrl(baseUrl);
  const miniappImageUrl = getMiniappImageUrl(baseUrl, imageRelativePath);
  return JSON.stringify({
    version: "1",
    imageUrl: miniappImageUrl || imageUrl || process.env.NEXT_PUBLIC_IMAGE_URL,
    button: {
      title: process.env.NEXT_PUBLIC_APP_NAME || title,
      action: {
        url: miniappBaseUrl,
        type: "launch_miniapp",
        name: title || process.env.NEXT_PUBLIC_APP_NAME,
        splashImageUrl: process.env.NEXT_PUBLIC_APP_SPLASH_IMAGE || new URL("/favicon.png", miniappBaseUrl).toString(),
        splashBackgroundColor: process.env.NEXT_PUBLIC_SPLASH_BACKGROUND_COLOR || "#212638",
      },
    },
  });
}

function getMiniappBaseUrl(baseUrl: string): string {
  return process.env.NEXT_PUBLIC_URL || baseUrl;
}

function getMiniappImageUrl(baseUrl: string, imageRelativePath: string): string {
  return new URL(imageRelativePath, getMiniappBaseUrl(baseUrl)).toString();
}

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : `http://localhost:${process.env.PORT || 3000}`;
const titleTemplate = "%s | WhoIsWho?";

export const getMetadata = ({
  title,
  description,
  imageRelativePath = "/thumbnail.jpg",
}: {
  title: string;
  description: string;
  imageRelativePath?: string;
}): Metadata => {
  const imageUrl = `${baseUrl}${imageRelativePath}`;

  return {
    metadataBase: new URL(getMiniappBaseUrl(baseUrl)),
    title: {
      default: title,
      template: titleTemplate,
    },
    description: description,
    openGraph: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description: description,
      images: [
        {
          url: getMiniappImageUrl(baseUrl, imageRelativePath),
        },
      ],
    },
    twitter: {
      title: {
        default: title,
        template: titleTemplate,
      },
      description: description,
      images: [getMiniappImageUrl(baseUrl, imageRelativePath)],
    },
    icons: {
      icon: [
        {
          url: "/favicon.png",
          sizes: "32x32",
          type: "image/png",
        },
      ],
    },
    other: {
      "fc:miniapp": buildMiniappEmbed(imageUrl, imageRelativePath, title, baseUrl),
    },
  };
};
