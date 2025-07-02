import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatInputModule } from '@angular/material/input';
import { LoginRoutingModule } from './login-routing.module';
import { LoginComponent } from './login.component';
import { MatCardModule } from '@angular/material/card';

@NgModule({
    declarations: [
        LoginComponent,
    ],
    imports: [
        CommonModule,
        NgbModule,
        LoginRoutingModule,
        FormsModule,
        MatButtonModule,
        MatInputModule,
        ReactiveFormsModule,
        MatCardModule
    ]
})

export class LoginModule { }
