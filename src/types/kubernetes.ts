/**
 * OwnerReference is a reference to the owner of the resource.
 *
 * **NOTE:** OwnerReferences cannot be cross-namespace.
 * @property {string} apiVersion - The API version of the owner
 * @property {string} kind - The kind of the owner
 * @property {string} name - The name of the owner
 */
export interface OwnerReference {
  apiVersion: string;
  kind: string;
  name: string;
}

/**
 * Common metadata fields for Kubernetes resources
 * @property {string} name - The name of the resource
 * @property {string} namespace - The Kubernetes namespace
 * @property {Record<string, string>} [labels] - Optional labels attached to the resource
 * @property {Record<string, string>} [annotations] - Optional annotations attached to the resource
 */
export interface Metadata {
  name: string;
  namespace: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  ownerReferences?: OwnerReference[];
}
