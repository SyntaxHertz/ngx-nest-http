import { chain, Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import {
  addDependency,
  addRootProvider,
  DependencyType,
} from '@schematics/angular/utility';

import type { NgAddOptions } from './schema';

export function ngAdd(options: NgAddOptions): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const project = resolveProjectName(tree, options.project);
    const mainPath = resolveMainFile(tree, project);

    context.logger.info('ngx-nest-http: adding provideHttpClient() and provideNestHttp().');
    context.logger.info('Enable emitDecoratorMetadata and useDefineForClassFields: false in tsconfig.json.');

    return chain([
      addDependency('class-validator', '^0.14.0', { type: DependencyType.Default }),
      addDependency('class-transformer', '^0.5.1', { type: DependencyType.Default }),
      addDependency('reflect-metadata', '^0.2.2', { type: DependencyType.Default }),
      addRootProvider(project, ({ code, external }) =>
        code`${external('provideHttpClient', '@angular/common/http')}()`,
      ),
      addRootProvider(project, ({ code, external }) =>
        code`${external('provideNestHttp', 'ngx-nest-http')}({ baseUrl: '' })`,
      ),
      addReflectMetadataImport(mainPath),
    ]);
  };
}

function resolveProjectName(tree: Tree, project?: string): string {
  if (project) {
    return project;
  }

  const workspace = readWorkspace(tree);
  const application = Object.entries(workspace.projects).find(
    ([, value]) => (value as { projectType?: string }).projectType === 'application',
  );

  if (!application) {
    throw new SchematicsException('No Angular application project found. Pass --project <name>.');
  }

  return application[0];
}

function resolveMainFile(tree: Tree, projectName: string): string | null {
  const project = readWorkspace(tree).projects[projectName] as {
    architect?: { build?: { options?: { browser?: string; main?: string } } };
  };

  return project.architect?.build?.options?.browser ?? project.architect?.build?.options?.main ?? null;
}

function addReflectMetadataImport(mainPath: string | null): Rule {
  return (tree: Tree) => {
    if (!mainPath || !tree.exists(mainPath)) {
      return tree;
    }

    const source = tree.read(mainPath);
    if (!source) {
      return tree;
    }

    const content = source.toString('utf-8');
    if (content.includes('reflect-metadata')) {
      return tree;
    }

    tree.overwrite(mainPath, `import 'reflect-metadata';\n${content}`);
    return tree;
  };
}

function readWorkspace(tree: Tree): { projects: Record<string, unknown> } {
  const buffer = tree.read('angular.json');
  if (!buffer) {
    throw new SchematicsException('angular.json not found.');
  }

  return JSON.parse(buffer.toString()) as { projects: Record<string, unknown> };
}
