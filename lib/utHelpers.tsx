"use client";

import {
  generateUploadButton,
  generateUploadDropzone,
} from "@uploadthing/react";

export const UploadButton = generateUploadButton({
  url: "https://v2.starko.one/api/uploadthing",
});

export const UploadDropzone = generateUploadDropzone({
  url: "https://v2.starko.one/api/uploadthing",
});
