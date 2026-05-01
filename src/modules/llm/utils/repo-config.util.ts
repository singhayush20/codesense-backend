import { RepoConfigErrors } from "../exceptions/repo-config.exceptions";

export class RepoConfigUtil {
  static validateModel(model: string): void {
    if (!model || model.trim().length === 0 || model.length > 100) {
      throw  RepoConfigErrors.invalidModel();
    }
  }
}
