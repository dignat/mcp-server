export type MermaidInput = | `${string}.md`
    | `${string}.markdown`
    | `${string}.mmd`
    | `${string}.mermaid`

export type MermaidOutput = | `${string}.png`
    | `${string}.svg`
    | `${string}.pdf`
    | "/dev/stdout"
    | string

export type MermaidType = `\`\`\`mermaid\n${string}\n\`\`\``