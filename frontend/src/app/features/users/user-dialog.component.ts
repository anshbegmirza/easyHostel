import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AppUser, UsersService } from './service/users.service';
import { TenantOption } from '../rooms/service/rooms.service';
import { StatusIconComponent } from '../../shared/status-icon.component';
import { prettyStatus } from '../../shared/status.util';

export type UserDialogMode = 'view' | 'edit';

@Component({
  selector: 'app-user-dialog',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StatusIconComponent,
  ],
  templateUrl: './user-dialog.component.html',
  styleUrl: './user-dialog.component.scss',
})
export class UserDialogComponent implements OnInit {
  readonly data = inject<{
    user: AppUser;
    mode: UserDialogMode;
    tenants: TenantOption[];
  }>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<UserDialogComponent, boolean>);
  readonly api = inject(UsersService);
  readonly fb = inject(FormBuilder);
  readonly pretty = prettyStatus;

  readonly mode = signal<UserDialogMode>(this.data.mode);
  readonly openedAsEdit = this.data.mode === 'edit';
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly tenants = signal<TenantOption[]>(this.data.tenants);
  readonly linkedNames = signal<string[]>([]);
  readonly linkedTenantIds = signal<string[]>([]);

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    username: [''],
    phone: [''],
    status: ['active', Validators.required],
    password: [''],
    tenantIds: [[] as string[]],
  });

  ngOnInit() {
    this.patchFromUser(this.data.user);
    if (this.data.user.role === 'parent') {
      this.loading.set(true);
      this.api.links(this.data.user.id).subscribe({
        next: (res) => {
          const ids = res.tenants.map((t) => t.id);
          this.linkedTenantIds.set(ids);
          this.linkedNames.set(res.tenants.map((t) => `${t.name} (${t.email})`));
          this.form.patchValue({ tenantIds: ids });
          if (this.data.mode === 'edit') {
            this.form.controls.tenantIds.setValidators([Validators.required]);
            this.form.controls.tenantIds.updateValueAndValidity();
          }
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
    }
  }

  patchFromUser(user: AppUser) {
    this.form.patchValue({
      name: user.name,
      email: user.email,
      username: user.username || '',
      phone: user.phone || '',
      status: user.status,
      password: '',
    });
  }

  startEdit() {
    this.mode.set('edit');
    if (this.data.user.role === 'parent') {
      this.form.controls.tenantIds.setValidators([Validators.required]);
      this.form.controls.tenantIds.updateValueAndValidity();
    }
  }

  cancelEdit() {
    if (this.openedAsEdit) {
      this.dialogRef.close(false);
      return;
    }
    this.patchFromUser(this.data.user);
    this.form.patchValue({ tenantIds: this.linkedTenantIds() });
    this.mode.set('view');
  }

  save() {
    if (this.form.invalid) {
      return;
    }
    const raw = this.form.getRawValue();
    const body: Parameters<UsersService['update']>[1] = {
      name: raw.name,
      email: raw.email,
      username: raw.username,
      phone: raw.phone || null,
      status: raw.status,
    };
    if (raw.password) {
      body.password = raw.password;
    }
    if (this.data.user.role === 'parent') {
      body.tenant_ids = raw.tenantIds;
    }
    this.saving.set(true);
    this.api.update(this.data.user.id, body).subscribe({
      next: () => {
        this.saving.set(false);
        this.dialogRef.close(true);
      },
      error: () => this.saving.set(false),
    });
  }
}
