export interface WorkflowRepository {
  exists(id: string): Promise<boolean>;
}
