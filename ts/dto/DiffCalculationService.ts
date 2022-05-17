

export class DiffCalculationService {

    previousStoredValue: number

    calculateDiff(newValue: number) {
        if (this.previousStoredValue == null) {
            this.previousStoredValue = newValue;
            return;
        }

        let diff = newValue - this.previousStoredValue;

    }
}
