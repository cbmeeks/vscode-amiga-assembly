import { MathCalc } from './mathcalc.js';
import { NumberParser } from './parser';

export class Calc {
    private numberParser = new NumberParser();
    /**
     * Performs the calculation
     * @param expression Expression to calculate
     */
    public calculate(expression: string): number {
        // call the function to calculate the expression
        const calc = new MathCalc();
        const expr = calc.parse(this.numberParser.transformToDecimal(expression));
        return expr.eval();
    }
}