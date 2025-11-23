import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UploadDeckComponent } from './upload-deck.component';

describe('UploadDeckComponent', () => {
  let component: UploadDeckComponent;
  let fixture: ComponentFixture<UploadDeckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UploadDeckComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UploadDeckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
