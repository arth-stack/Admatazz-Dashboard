import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchDeckComponent } from './search-deck.component';

describe('SearchDeckComponent', () => {
  let component: SearchDeckComponent;
  let fixture: ComponentFixture<SearchDeckComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SearchDeckComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchDeckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
