import { Component, Input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { prettyStatus, statusIcon, statusTone, StatusTone } from './status.util';

@Component({
  selector: 'app-status-icon',
  imports: [MatIconModule, MatTooltipModule],
  templateUrl: './status-icon.component.html',
  styleUrl: './status-icon.component.scss',
})
export class StatusIconComponent {
  @Input({ required: true }) status = '';
  @Input() label = '';
  @Input() showLabel = true;
  @Input() icon = '';
  @Input() tone: StatusTone | '' = '';

  get resolvedTone() {
    return this.tone || statusTone(this.status);
  }

  get resolvedIcon() {
    return this.icon || statusIcon(this.status);
  }

  get displayLabel() {
    return this.label || prettyStatus(this.status);
  }

  get tooltipText() {
    return this.displayLabel;
  }
}
