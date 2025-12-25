import { string } from "zod";
import { MermaidType } from "../types/mermaid-input-type.js";

export const isMermaid = (mermaid?: MermaidType): Boolean => {
    if (typeof mermaid) {
        return true
    }
    return false
}