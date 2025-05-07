import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {
  user = {
    name: 'John Doe',
    avatar: 'user-removebg-preview.png'
  };

  navLinks = [
    {label: 'Home', url: '/home'},
    {label: 'About', url: '/about'},
    {label: 'Contact', url: '/contact'}
  ];
}
