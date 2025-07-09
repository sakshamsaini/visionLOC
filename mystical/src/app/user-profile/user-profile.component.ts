import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

@Component({
	selector: 'app-user-profile',
	templateUrl: './user-profile.component.html',
	styleUrls: ['./user-profile.component.scss']
})
export class UserProfileComponent implements OnInit {

	user: any;
	showCard = false;
	initials: string = '';

	@ViewChild('cardRef') cardRef!: ElementRef;
	@ViewChild('triggerRef') triggerRef!: ElementRef;

	constructor(
		private router: Router,
	) { }

	ngOnInit(): void {
		const userObj = localStorage.getItem("user");

		if (userObj) {
			this.user = JSON.parse(userObj);
			this.getInitials(this.user.name);
		}
	}

	toggleCard() {
		this.showCard = !this.showCard;
	}

	@HostListener('document:click', ['$event'])
	onClickOutside(event: MouseEvent) {
		const clickedInsideCard = this.cardRef?.nativeElement.contains(event.target);
		const clickedOnTrigger = this.triggerRef?.nativeElement.contains(event.target);

		if (!clickedInsideCard && !clickedOnTrigger) {
			this.showCard = false;
		}
	}

	getInitials(name: string) {
		const words = name.trim().split(' ');
		if (words.length === 1) {
			this.initials = words[0].charAt(0).toUpperCase();
		} else {
			this.initials = words[0].charAt(0).toUpperCase() + words[1].charAt(0).toUpperCase();
		}
	}

	logout() {
		this.showCard = false;

		localStorage.removeItem('signUpID');
		localStorage.removeItem('user');
		this.router.navigate(['/login']);
	}

}
