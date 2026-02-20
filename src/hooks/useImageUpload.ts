"use client";

import { useCallback } from "react";
import { useDocumentStore } from "@/store/documentStore";

export function useImageUpload() {
  const { source, setSource } = useDocumentStore();

  const uploadImage = useCallback(
    async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/images", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Upload failed");

      const { id, url } = await res.json();

      // Insert \includegraphics before \end{document}
      const insert = `\\begin{figure}[h]\n\\centering\n\\includegraphics[width=0.8\\textwidth]{${url}}\n\\caption{${file.name}}\n\\label{fig:${id}}\n\\end{figure}\n`;

      const endDocIdx = source.lastIndexOf("\\end{document}");
      if (endDocIdx !== -1) {
        const newSource =
          source.slice(0, endDocIdx) + insert + "\n" + source.slice(endDocIdx);
        setSource(newSource);
      }

      return { id, url };
    },
    [source, setSource]
  );

  return { uploadImage };
}
