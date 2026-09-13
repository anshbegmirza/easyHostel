import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import {
  AppModuleGrant,
  ModuleTemplateSummary,
  RolesService,
} from './service/roles.service';
import { AppUser } from '../users/service/users.service';
import { prettyStatus } from '../../shared/status.util';

type EditMode = 'user' | 'template' | 'template-create';

const ROLE_OPTIONS = [
  { value: 'superuser', label: 'Superuser' },
  { value: 'admin', label: 'Admin' },
  { value: 'staff', label: 'Staff' },
  { value: 'tenant', label: 'Tenant' },
  { value: 'parent', label: 'Parent' },
];

@Component({
  selector: 'app-modules-edit-page',
  imports: [
    FormsModule,
    RouterLink,
    MatButtonModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './modules-edit.page.html',
  styleUrl: './modules-edit.page.scss',
})
export class ModulesEditPageComponent implements OnInit {
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);
  readonly api = inject(RolesService);
  readonly pretty = prettyStatus;
  readonly roleOptions = ROLE_OPTIONS;

  readonly mode = signal<EditMode>('user');
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly applying = signal(false);
  readonly notFound = signal<string | null>(null);
  readonly user = signal<AppUser | null>(null);
  readonly templateId = signal<string | null>(null);
  readonly modules = signal<AppModuleGrant[]>([]);

  templates: ModuleTemplateSummary[] = [];
  applyTemplateId = '';
  templateName = '';
  roleKey: string | null = null;

  backLink() {
    return this.mode() === 'user' ? '/user-roles' : '/templates';
  }

  backLabel() {
    return this.mode() === 'user' ? 'User roles' : 'Templates';
  }

  crumbLabel() {
    const m = this.mode();
    if (m === 'template-create') {
      return 'Add template';
    }
    if (m === 'template') {
      return this.templateName || 'Edit template';
    }
    return this.user()?.name || 'Edit modules';
  }

  detailsTitle() {
    const m = this.mode();
    if (m === 'user') {
      return 'User details';
    }
    if (m === 'template-create') {
      return 'Template details';
    }
    return 'Template details';
  }

  pageSubtitle() {
    const m = this.mode();
    if (m === 'template-create') {
      return 'Name the pack, pick modules, then Create';
    }
    if (m === 'template') {
      return 'Changes apply on next “Apply template”, not existing users automatically';
    }
    const u = this.user();
    return u
      ? `Role · ${this.pretty(u.role)} · apply a template or toggle modules, then Save`
      : 'Module access for this account';
  }

  canSave() {
    if (this.loading() || this.saving() || this.notFound()) {
      return false;
    }
    if (this.mode() === 'user') {
      return !!this.user();
    }
    return !!this.templateName.trim();
  }

  ngOnInit() {
    const path = this.route.snapshot.routeConfig?.path || '';
    if (path.startsWith('user-roles')) {
      this.mode.set('user');
      this.loadUser(this.route.snapshot.paramMap.get('userId'));
      return;
    }
    if (path === 'templates/new') {
      this.mode.set('template-create');
      this.loadCreate();
      return;
    }
    this.mode.set('template');
    this.loadTemplate(this.route.snapshot.paramMap.get('templateId'));
  }

  loadUser(userId: string | null) {
    if (!userId) {
      this.notFound.set('User not found');
      this.loading.set(false);
      return;
    }
    this.api.getUserGrants(userId).subscribe({
      next: (res) => {
        this.user.set(res.user);
        this.templates = res.templates || [];
        const match = this.templates.find((t) => t.role_key === res.user.role);
        this.applyTemplateId = match?.id || this.templates[0]?.id || '';
        this.modules.set(res.modules);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set('User not found');
        this.loading.set(false);
      },
    });
  }

  loadCreate() {
    this.api.listModules().subscribe({
      next: (res) => {
        this.modules.set(res.modules.map((m) => ({ ...m, granted: false })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadTemplate(id: string | null) {
    if (!id) {
      this.notFound.set('Template not found');
      this.loading.set(false);
      return;
    }
    this.api.getTemplate(id).subscribe({
      next: (res) => {
        this.templateId.set(res.template.id);
        this.templateName = res.template.name;
        this.roleKey = res.template.role_key;
        this.modules.set(res.modules);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set('Template not found');
        this.loading.set(false);
      },
    });
  }

  isLocked(code: string) {
    if (this.mode() === 'user') {
      return (
        this.user()?.role !== 'superuser' &&
        (code === 'user-roles' || code === 'templates')
      );
    }
    return this.roleKey !== 'superuser' && (code === 'user-roles' || code === 'templates');
  }

  toggle(mod: AppModuleGrant, granted: boolean) {
    this.modules.update((list) =>
      list.map((m) => (m.code === mod.code ? { ...m, granted } : m))
    );
  }

  setAll(granted: boolean) {
    this.modules.update((list) =>
      list.map((m) => (this.isLocked(m.code) ? m : { ...m, granted }))
    );
  }

  applyTemplate() {
    if (!this.applyTemplateId) {
      return;
    }
    this.applying.set(true);
    this.api.getTemplate(this.applyTemplateId).subscribe({
      next: (res) => {
        const granted = new Set(res.modules.filter((m) => m.granted).map((m) => m.code));
        this.modules.update((list) =>
          list.map((m) => ({
            ...m,
            granted: this.isLocked(m.code) ? false : granted.has(m.code),
          }))
        );
        this.applying.set(false);
      },
      error: () => this.applying.set(false),
    });
  }

  save() {
    const codes = this.modules()
      .filter((m) => m.granted)
      .map((m) => m.code);
    this.saving.set(true);

    if (this.mode() === 'user') {
      const u = this.user();
      if (!u) {
        this.saving.set(false);
        return;
      }
      this.api.saveUserGrants(u.id, codes).subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/user-roles']);
        },
        error: () => this.saving.set(false),
      });
      return;
    }

    if (this.mode() === 'template-create') {
      this.api
        .createTemplate({
          name: this.templateName.trim(),
          role_key: this.roleKey,
          module_codes: codes,
        })
        .subscribe({
          next: () => {
            this.saving.set(false);
            this.router.navigate(['/templates']);
          },
          error: () => this.saving.set(false),
        });
      return;
    }

    const id = this.templateId();
    if (!id) {
      this.saving.set(false);
      return;
    }
    this.api
      .saveTemplate(id, {
        name: this.templateName.trim(),
        role_key: this.roleKey,
        module_codes: codes,
      })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.router.navigate(['/templates']);
        },
        error: () => this.saving.set(false),
      });
  }
}
