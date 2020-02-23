import { Component, Input } from '@angular/core';

@Component({
  selector: 'side-bar-button',
  templateUrl: './side-bar-button.component.html',
  styleUrls: [ './side-bar-button.component.scss' ],
})
export class SideBarButtonComponent {
  @Input() public icon?: string;
  @Input() public label?: string;
  @Input() public routerLink?: string;
}
