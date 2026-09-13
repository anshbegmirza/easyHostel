import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ModuleTemplateSummary, RolesService } from './service/roles.service';
import { H4TableComponent } from '../../shared/h4-table/h4-table.component';
import { H4TableAction, H4TableColumn } from '../../shared/h4-table/h4-table.types';

@Component({
  selector: 'app-templates-page',
  imports: [MatButtonModule, MatIconModule, H4TableComponent],
  templateUrl: './templates.page.html',
  styleUrl: './templates.page.scss',
})
export class TemplatesPageComponent implements OnInit {
  readonly api = inject(RolesService);
  readonly router = inject(Router);

  readonly loading = signal(true);
  readonly templates = signal<ModuleTemplateSummary[]>([]);

  readonly columns: H4TableColumn<ModuleTemplateSummary>[] = [
    { key: 'name', header: 'Name', field: 'name', type: 'strong' },
    { key: 'code', header: 'Code', field: 'code' },
    {
      key: 'roleKey',
      header: 'Default for',
      cell: (row) => {
        if (!row.role_key) {
          return '—';
        }
        if (row.role_key === 'tenant') {
          return 'Tenant';
        }
        return row.role_key.charAt(0).toUpperCase() + row.role_key.slice(1);
      },
    },
    {
      key: 'modules',
      header: 'Modules',
      cell: (row) => String(row.module_count),
    },
  ];

  readonly actions: H4TableAction<ModuleTemplateSummary>[] = [
    {
      id: 'edit',
      icon: 'edit',
      tooltip: 'Edit modules',
      color: 'primary',
    },
  ];

  ngOnInit() {
    this.reload();
  }

  reload() {
    this.loading.set(true);
    this.api.listTemplates().subscribe({
      next: (res) => {
        this.templates.set(res.templates);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openAdd() {
    this.router.navigate(['/templates/new']);
  }

  openEdit(template: ModuleTemplateSummary) {
    this.router.navigate(['/templates', template.id]);
  }

  onAction(event: { actionId: string; row: ModuleTemplateSummary }) {
    if (event.actionId === 'edit') {
      this.openEdit(event.row);
    }
  }
}
