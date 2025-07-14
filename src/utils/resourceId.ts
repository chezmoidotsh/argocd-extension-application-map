/**
 * Generates a unique ID for a resource in the format kind/namespace/name
 * @param kind - The kind of the resource
 * @param namespace - The namespace of the resource
 * @param name - The name of the resource
 * @returns The generated ID
 */
export function resourceId(kind: string, namespace: string, name: string): string {
  return `${kind}/${namespace}/${name}`;
}
