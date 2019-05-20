export function dynCurrency(ammount: number) {
    let ammountStr: string;
    if (Number.isInteger(ammount)) {
        ammountStr = ammount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    } else {
        ammountStr = ammount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, "$&,");
    }
    return `$${ammountStr}`;
}
