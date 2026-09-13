import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/authentication/auth.service';
import { HostelContextService } from '../../core/hostel/hostel-context.service';
import { StatusIconComponent } from '../../shared/status-icon.component';
import { prettyStatus } from '../../shared/status.util';

@Component({
  selector: 'app-profile-page',
  imports: [MatIconModule, StatusIconComponent],
  templateUrl: './profile.page.html',
  styleUrl: './profile.page.scss',
})
export class ProfilePageComponent {
  readonly auth = inject(AuthService);
  readonly hostel = inject(HostelContextService);
  readonly pretty = prettyStatus;

  initials() {
    const name = this.auth.user()?.name || '?';
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || '')
      .join('');
  }
}
