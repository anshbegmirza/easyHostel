import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AppUser } from '../../users/service/users.service';

export interface AppModuleGrant {
  id: string;
  code: string;
  name: string;
  granted: boolean;
}

export interface RoleUserRow extends AppUser {
  grant_count: number;
}

export interface ModuleTemplateSummary {
  id: string;
  name: string;
  code: string;
  role_key: string | null;
  module_count: number;
}

@Injectable({ providedIn: 'root' })
export class RolesService {
  readonly http = inject(HttpClient);

  listUsers() {
    return this.http.get<{ users: RoleUserRow[] }>('/roles/users');
  }

  getUserGrants(userId: string) {
    return this.http.get<{
      user: AppUser;
      modules: AppModuleGrant[];
      templates: ModuleTemplateSummary[];
    }>(`/roles/${userId}`);
  }

  saveUserGrants(userId: string, moduleCodes: string[]) {
    return this.http.put<{ user: AppUser; modules: AppModuleGrant[] }>(`/roles/${userId}`, {
      module_codes: moduleCodes,
    });
  }

  applyTemplate(userId: string, templateId: string) {
    return this.http.post<{
      user: AppUser;
      modules: AppModuleGrant[];
      applied_template_id: string;
    }>(`/roles/${userId}/apply-template`, { template_id: templateId });
  }

  listTemplates() {
    return this.http.get<{ templates: ModuleTemplateSummary[] }>('/roles/templates');
  }

  listModules() {
    return this.http.get<{ modules: { id: string; code: string; name: string }[] }>(
      '/roles/modules'
    );
  }

  getTemplate(id: string) {
    return this.http.get<{ template: ModuleTemplateSummary; modules: AppModuleGrant[] }>(
      `/roles/templates/${id}`
    );
  }

  createTemplate(body: {
    name: string;
    role_key?: string | null;
    module_codes: string[];
  }) {
    return this.http.post<{ template: ModuleTemplateSummary; modules: AppModuleGrant[] }>(
      '/roles/templates',
      body
    );
  }

  saveTemplate(
    id: string,
    body: { name?: string; role_key?: string | null; module_codes: string[] }
  ) {
    return this.http.put<{ template: ModuleTemplateSummary; modules: AppModuleGrant[] }>(
      `/roles/templates/${id}`,
      body
    );
  }

  deleteTemplate(id: string) {
    return this.http.delete<{ ok: boolean }>(`/roles/templates/${id}`);
  }
}
