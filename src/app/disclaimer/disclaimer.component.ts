import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';


export interface DialogData {
    disclaimer: any;
    updated: string;
}
  
@Component({
    selector: 'disclaimer-dialog',
    templateUrl: 'disclaimer.component.html',
    styleUrls: ['./disclaimer.component.sass'],
    standalone: true,
    imports: [ MatDialogModule, MatButtonModule, CommonModule ]
})
export class DialogOverviewExampleDialog {
    constructor(
        public dialogRef: MatDialogRef<DialogOverviewExampleDialog>,
        @Inject(MAT_DIALOG_DATA) public data: DialogData,
    ) {}
    onNoClick(): void {
        this.dialogRef.close();
    }
}