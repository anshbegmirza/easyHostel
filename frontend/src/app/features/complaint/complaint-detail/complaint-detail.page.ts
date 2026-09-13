import { DatePipe } from '@angular/common';
import { Component, OnDestroy, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { Complaint, ComplaintEvent, ComplaintsService } from '../service/complaints.service';
import { AuthService } from '../../../core/authentication/auth.service';
import { isStaffRole } from '../../../core/roles';
import { StatusIconComponent } from '../../../shared/status-icon.component';
import { prettyStatus, statusTone } from '../../../shared/status.util';

@Component({
  selector: 'app-complaint-detail-page',
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatIconModule,
    StatusIconComponent,
  ],
  templateUrl: './complaint-detail.page.html',
  styleUrl: './complaint-detail.page.scss',
})
export class ComplaintDetailPageComponent implements OnInit, OnDestroy {
  readonly api = inject(ComplaintsService);
  readonly auth = inject(AuthService);
  readonly route = inject(ActivatedRoute);
  readonly fb = inject(FormBuilder);

  readonly loading = signal(true);
  readonly busy = signal(false);
  readonly staff = signal(false);
  readonly complaint = signal<Complaint | null>(null);
  readonly events = signal<ComplaintEvent[]>([]);
  readonly photoUrl = signal<string | null>(null);
  readonly tone = statusTone;
  readonly pretty = prettyStatus;
  readonly eventColumns = ['status', 'note', 'actor', 'when'];

  readonly statusForm = this.fb.nonNullable.group({
    status: ['open'],
    note: [''],
  });

  ngOnInit() {
    this.staff.set(isStaffRole(this.auth.user()?.role));
    this.load();
  }

  ngOnDestroy() {
    const url = this.photoUrl();
    if (url) {
      URL.revokeObjectURL(url);
    }
  }

  load() {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.loading.set(true);
    this.api.get(id).subscribe({
      next: (res) => {
        this.complaint.set(res.complaint);
        this.events.set(res.events);
        this.statusForm.patchValue({ status: res.complaint.status, note: '' });
        this.loading.set(false);
        if (res.complaint.has_photo) {
          this.api.photo(id).subscribe({
            next: (blob) => {
              const prev = this.photoUrl();
              if (prev) {
                URL.revokeObjectURL(prev);
              }
              this.photoUrl.set(URL.createObjectURL(blob));
            },
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }

  saveStatus() {
    const id = this.complaint()?.id;
    if (!id) {
      return;
    }
    this.busy.set(true);
    this.api.updateStatus(id, this.statusForm.getRawValue()).subscribe({
      next: (res) => {
        this.complaint.set(res.complaint);
        this.events.set(res.events);
        this.busy.set(false);
      },
      error: () => this.busy.set(false),
    });
  }
}
