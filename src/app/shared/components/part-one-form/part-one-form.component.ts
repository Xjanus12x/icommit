import { Component, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormArray,
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FormContentService } from '../../services/form-content.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { BackendService } from 'src/app/core/services/backend.service';
import { RouterService } from 'src/app/modules/services/router-service.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-part-one-form',
  templateUrl: './part-one-form.component.html',
  styleUrls: ['./part-one-form.component.css'],
})
export class PartOneFormComponent implements OnInit {
  formGroup!: FormGroup;
  step = 0;
  isAdmin: boolean = false;
  isFaculty: boolean = false;
  actionPlans: string[] = [];
  totalWeights: Map<string, number> = new Map<string, number>();
  currentUserRole: string = '';
  stepLabels: string[] = [];
  overallAverageRating: number = 0;
  isDoneRating: boolean = false;
  igcHeaders: string[] = [
    'Personal Objective',
    'Personal Measures (KPI)',
    'Target',
    'Initiatives',
    'Weight',
    'Achieved',
    'Rating (1 - 4)',
  ];
  @Input() kpis: any[] = [];
  @Input() responsible: string = '';
  @Input() isFillingUp: boolean = false;

  toppingList: string[] = [
    'Extra cheese',
    'Mushroom',
    'Onion',
    'Pepperoni',
    'Sausage',
    'Tomato',
  ];

  constructor(
    private formContentService: FormContentService,
    private authService: AuthService,
    private backendService: BackendService,
    private routerService: RouterService,
    private fb: FormBuilder,
    private activatedRoute: ActivatedRoute
  ) {
    this.formGroup = this.fb.group({});
  }

  // Function to get the selectedActionPlans control
  getSelectedActionPlansControl(index: number): FormControl | null {
    const formArray = this.formGroup.get(
      this.getLabel(this.stepLabels[index])
    ) as FormArray;
    return formArray
      ? (formArray.get('selectedActionPlans') as FormControl)
      : null;
  }

  // getSelectedActionPlansCtrl(groupName: string): FormControl {
  //   return this.formGroup
  //     ?.get(groupName)
  //     ?.get('selectedActionPlans') as FormControl;
  // }

  ngOnInit() {
    this.authService.getUserRole().subscribe({
      next: (role) => {
        this.isAdmin = role === 'Admin';
        this.isFaculty = role === 'Faculty';
        this.currentUserRole = role;
      },
      error: (error) => {
        console.error('Error fetching user role:', error);
      },
    });
    this.activatedRoute.queryParamMap.subscribe((params) => {
      this.isDoneRating = !!params.get('rateDate');
    });

    if (this.isFillingUp) {
      this.stepLabels = this.formContentService.getStepLabels();
      this.stepLabels.forEach((label: string) => {
        const stepLabel = this.getLabel(label).trim();
        this.formGroup.addControl(
          stepLabel,
          this.fb.group({
            selectedActionPlans: [[], [Validators.required]],
            [stepLabel]: this.fb.array([]),
          })
        );
      });
    } else if (this.isAdminRating()) {
      const selectedKpiMap = new Map<string, number>();
      this.activatedRoute.paramMap.subscribe((params) => {
        const id = params.get('id');
        this.backendService.getSubmittedIgcfDetails(id!).subscribe({
          next: (igcfDetails: any) => {
            igcfDetails.forEach((elem: any) => {
              const { selected_kpi, weight } = elem;
              if (selectedKpiMap.has(selected_kpi)) {
                const currentWeight = selectedKpiMap.get(selected_kpi)!;
                selectedKpiMap.set(
                  selected_kpi,
                  currentWeight + parseInt(weight)
                );
              } else {
                selectedKpiMap.set(selected_kpi, parseInt(weight));
              }
            });

            selectedKpiMap.forEach((weight, selected_kpi) => {
              this.stepLabels.push(`${selected_kpi} ${weight}%`);
            });
            this.stepLabels.forEach((label: string) => {
              this.formGroup.addControl(
                this.getLabel(label).trim(),
                this.fb.group({
                  selectedActionPlans: [[], [Validators.required]],
                  [this.getLabel(label).trim()]: this.fb.array([]),
                })
              );
            });

            const selectedPlans: any = {};
            igcfDetails.forEach((elem: any, i: number) => {
              // Check if the selected_kpi already exists as a key in selectedPlans
              if (!(elem.selected_kpi in selectedPlans)) {
                // If not, initialize it as an empty array
                selectedPlans[elem.selected_kpi] = [];
              }

              // Push the selected_plan into the array under the corresponding selected_kpi key
              selectedPlans[elem.selected_kpi].push(elem.selected_plan);

              this.addFormGroupForAdmin(elem.selected_kpi, elem);
            });

            for (const key in selectedPlans) {
              if (selectedPlans.hasOwnProperty(key)) {
                const value = selectedPlans[key];
                // Get the form group corresponding to the selected_kpi
                const formGroup = this.formGroup.get(key) as FormGroup;

                // Set the value of selectedActionPlans control
                const selectedActionPlansControl =
                  this.getSelectedActionPlansControlForAdmin(key);
                if (selectedActionPlansControl) {
                  selectedActionPlansControl.setValue(value);
                }
              }
            }
          },
          error: (error: any) => {
            console.error('Error fetching IGCF details:', error);
          },
        });
      });
    }
  }

  // Function to get the selectedActionPlans control
  getSelectedActionPlansControlForAdmin(key: string): FormControl | null {
    const formArray = this.formGroup.get(key) as FormArray;
    return formArray
      ? (formArray.get('selectedActionPlans') as FormControl)
      : null;
  }

  addFormGroupForAdmin(formArrayName: string, values: any) {
    const formArray = this.formGroup
      .get(formArrayName)
      ?.get(formArrayName) as FormArray;
    formArray.push(this.createFormGroupForAdmin(values));
  }

  createFormGroupForAdmin(values: any): FormGroup {
    const selectedPlanWeight: string = values.selected_plan_weight;

    return this.fb.group({
      uniqueId: [values.id],
      personalObject: [
        { value: values.selected_plan, disabled: true },
        Validators.required,
      ],
      personalMeasures: [
        {
          value: values.personal_measures_kpi,
          disabled: true,
        },
        Validators.required,
      ],
      target: [
        { value: selectedPlanWeight, disabled: true },
        Validators.required,
      ],
      initiatives: [
        { value: values.initiatives, disabled: true },
        Validators.required,
      ],
      weight: [{ value: values.weight, disabled: true }, Validators.required],
      achieved: [
        {
          value: values.achieved || '',
          disabled: this.isDoneRating,
        },
        Validators.required,
      ],
      rating: [
        {
          value: values.rating || '',
          disabled: this.isDoneRating,
        },
        Validators.required,
      ],
    });
  }

  isAdminRating(): boolean {
    return (
      this.routerService.isRouteActive('submitted-form/:id/:completionDate') &&
      this.isAdmin
    );
  }

  getActionPlans(label: string): string[] {
    const actionPlans = this.kpis.filter(
      (kpi: any) => kpi.kpi_title.trim() === this.getLabel(label)
    );
    return actionPlans.map((kpi) => kpi.action_plan);
  }

  // onActionPlanSelectionChange(value: string, label: string, index: number) {
  //   // Filter kpis array to find the selected plan
  //   const selectedPlan = this.kpis.find((kpi) => {
  //     return kpi.kpi_title === label && kpi.action_plan === value;
  //   });
  //   // Set the target control value to the selected plan's weight percentage
  //   if (selectedPlan) {
  //     const targetControl = this.formGroup.get(
  //       `${label}.${index}.target`
  //     ) as FormControl;
  //     targetControl.setValue(`${selectedPlan.target}`);
  //   }
  // }

  getValues() {
    const values: any = this.formGroup.value;
    if (this.isFillingUp) {
      const igcfInputs: any[] = [];
      // Loop through each key-value pair
      Object.entries(values).forEach(([key, value]: [string, any]) => {
        // Here, 'key' represents the form group name and 'value' represents the form group object

        // Now you can access the properties of the form group object directly
        const selectedActionPlans = value.selectedActionPlans;
        const inputs = value[key];

        selectedActionPlans.forEach((plan: string, i: number) => {
          igcfInputs.push({
            selected_kpi: key,
            ...inputs[i],
          });
        });
      });
      return igcfInputs;
    }

    let totalRating = 0;
    let totalRatingsEncountered = 0;

    // Loop through each key-value pair
    Object.entries(values).forEach(([key, value]: [string, any]) => {
      value[key].forEach((item: any, index: number) => {
        // Convert the rating to a number and add it to the totalRating
        totalRating += parseInt(item.rating);
        // Increment the totalRatingsEncountered
        totalRatingsEncountered++;
      });
    });

    let averageRating = 0;

    // Calculate the average rating
    if (totalRatingsEncountered !== 0) {
      averageRating = totalRating / totalRatingsEncountered;
      this.setOverallAverageRating(averageRating);
    }

    const adminInputs: any[] = [];
    // Loop through each key-value pair
    Object.entries(values).forEach(([key, value]: [string, any]) => {
      value[key].forEach((item: any) => {
        adminInputs.push({
          uniqueId: item.uniqueId,
          achieved: item.achieved,
          rating: item.rating,
        });
      });
    });
    return adminInputs;
  }

  setOverallAverageRating(overallAverage: number) {
    this.overallAverageRating = overallAverage;
  }
  getOverallAverageRating() {
    return this.overallAverageRating;
  }
  validateFormGroup(): boolean {
    if (this.formGroup.invalid) {
      this.authService.openSnackBar(
        'Please fill out all required fields correctly.',
        'close',
        'bottom'
      );
      return false;
    }
    if (this.isFillingUp) {
      // Clear the totalWeights map before recalculating
      this.totalWeights.clear();

      // Get an array of keys for the form group
      const formGroupKeys = Object.keys(this.formGroup.controls);

      // Loop through each key (which corresponds to a form array)
      formGroupKeys.forEach((key: string) => {
        // Get the form array using the key
        const formArray = this.formGroup.get(key)?.get(key) as FormArray;

        // Calculate the total weight for the current form array
        const totalWeight = this.calculateTotalWeight(formArray);

        // Store the total weight in the map
        this.totalWeights.set(key, totalWeight);
      });

      const kpiSetPercentage = new Map<string, string>();

      this.stepLabels.forEach((label) => {
        const matches = label.match(/\d+%$/); // Match the numeric value followed by '%'
        if (matches) {
          const percentage = matches[0].replace('%', ''); // Extract the matched percentage value and remove the '%'
          const labelWithoutPercentage = label.replace(matches[0], '').trim(); // Remove the percentage from the label

          kpiSetPercentage.set(labelWithoutPercentage, percentage);
        }
      });

      for (const [key, value] of kpiSetPercentage.entries()) {
        let percent = Number(value);
        let facultySetWeight = this.totalWeights.get(key);
        if (
          percent !== facultySetWeight ||
          facultySetWeight > percent ||
          facultySetWeight < percent
        ) {
          this.authService.openSnackBar(
            `Please distribute weight evenly for ${key}.`,
            'close',
            'bottom'
          );
          return false; // This will exit the function and return false
        }
      }

      // return true; // Return true if all checks pass
    }
    return this.formGroup.valid;
  }

  calculateTotalWeight(formArray: FormArray): number {
    // Use reduce to calculate the total weight for the current form array
    return formArray.controls.reduce(
      (acc: number, control: AbstractControl) => {
        if (control instanceof FormGroup) {
          // Get the weight form control value and add it to the accumulator
          const weightControl = control.get('weight');
          if (weightControl) {
            return acc + (+weightControl.value || 0); // Convert to number using '+' operator
          }
        }
        return acc; // Return accumulator unchanged if the control is not a FormGroup
      },
      0
    );
  }

  getFormControl(label: string, index: number, controlName: string) {
    return this.formGroup.get(
      `${label}.${index}.${controlName}`
    ) as FormControl;
  }

  trackByIndex(index: number, item: any): number {
    return index; // Or return item.id if you have unique identifiers
  }
  createFormGroupForFaculty(
    personaObjective: string,
    target: string
  ): FormGroup {
    return this.fb.group({
      personalObject: [
        { value: personaObjective, disabled: !this.isFillingUp },
        Validators.required,
      ],
      personalMeasures: [
        { value: '', disabled: !this.isFillingUp },
        Validators.required,
      ],
      target: [
        { value: target, disabled: !this.isFillingUp },
        Validators.required,
      ],
      initiatives: [
        { value: '', disabled: !this.isFillingUp },
        Validators.required,
      ],
      weight: [{ value: '', disabled: !this.isFillingUp }, Validators.required],
      achieved: [
        { value: '', disabled: this.isFillingUp },
        Validators.required,
      ],
      rating: [{ value: '', disabled: this.isFillingUp }, Validators.required],
    });
  }
  getPersonalObjectControl(
    arrayName: string,
    controlName: string,
    index: number
  ): AbstractControl {
    const actionPlansArray = this.getFormArrayControls(arrayName);
    const actionPlanGroup = actionPlansArray.at(index) as FormGroup;
    return actionPlanGroup.get(controlName) as AbstractControl;
  }
  removeIGCControl(arrayName: string, index: number) {
    const formArray = this.formGroup.get(arrayName.trim()) as FormArray;
    formArray.removeAt(index);
    this.getFormArrayLength(arrayName);
  }

  getFormArrayLength(arrayName: string): number {
    const formArray = this.formGroup.get(arrayName.trim()) as FormArray;
    return formArray.length;
  }

  onSelectionChange(selectedValues: any[], formArrayName: string) {
    const formArray = this.formGroup
      .get(formArrayName)
      ?.get(formArrayName) as FormArray;

    // Get the currently selected values in the form array
    const currentValues = formArray.value.map(
      (item: any) => item.personalObject
    );

    // Find the values that were unselected
    const unselectedValues = currentValues.filter(
      (value: any) => !selectedValues.includes(value)
    );

    // Remove form groups corresponding to unselected values
    unselectedValues.forEach((value: any) => {
      const index = formArray.value.findIndex(
        (item: any) => item.personalObject === value
      );
      if (index !== -1) {
        formArray.removeAt(index);
      }
    });

    // Add form groups for newly selected values
    selectedValues.forEach((value) => {
      if (!currentValues.includes(value)) {
        this.kpis.forEach((kpi: any) => {
          if (kpi.action_plan === value) {
            formArray.push(this.createFormGroupForFaculty(value, kpi.target));
          }
        });
      }
    });
  }

  getLabel(label: string) {
    // Split the label by space and remove the last part
    const parts = label.split(' ').slice(0, -1);
    // Join the remaining parts back together with a space in between
    return parts.join(' ');
  }

  getFormArrayName(label: string) {
    return this.getLabel(label);
  }
  getFormGroupName(label: string) {
    return this.getLabel(label);
  }
  getSelectedPlanValue(i: number, j: number) {
    return this.getSelectedActionPlansControl(i)?.value[j];
  }

  // Inside your component class
  getControlValue(
    formArrayName: string,
    index: number,
    controlName: string
  ): string {
    const formArray = this.formGroup
      .get(formArrayName)
      ?.get(formArrayName) as FormArray;
    const control = formArray.controls[index].get(controlName);
    return control ? control.value : '';
  }

  getFormArrayControls(arrayName: string): FormArray {
    return this.formGroup.get(arrayName)?.get(arrayName) as FormArray;
  }

  igcControls(): FormArray {
    return this.formGroup.get('igc') as FormArray;
  }
}
