//#region example interface
interface Product {
  id: string;
  price: number;
  name: string;
  description: string;
  author: string;
  date: Date;
  category: string;
}
//#endregion

//#region Example of Partial
/**
 * We see that the partial example allows us to populate the fields we want from Product.
 * However if we want to access the object, we see that the props as still optional.
 * So in those cases (or cases when we want stricter types), we want Pick!
 */
const partialExample: Partial<Product> = { id: "1", name: "Bread" };
type PartialExampleType = typeof partialExample; // { id?: string, name?: string, ...} / Still a Partial<Product>
type PartialExamplePropType = typeof partialExample.id; // string | undefined
//#endregion

//#region Example of Pick
/**
 * Pick gives us an object with only the fields we care about.
 * We still have type safety, auto completion (CTRL + SPACE) & ability to refactor (change/remove) props.
 * But we have this "duplication" of typing our props - 1 for creating the Pick (TS Land); and 1 for the actual object (JS Land)
 * Might not be much of an issue for smaller interfaces, but can be more of an issue/annoyance for larger interfaces.
 *
 * Lets try creating an implicit Pick function.
 */
type PickedProps = Pick<Product, "id" | "price" | "name" | "category">;
const pickExample: PickedProps = {
  id: "1",
  price: 5.0,
  name: "bread",
  category: "Bakery & Cakes",
};
type PickExampleType = typeof pickExample; // { id: string, price: number, name: string, category: string }
type PickExamplePropType = typeof pickExample.name; // string
//#endregion

//#region Implicit Pick Version 1
/**
 * This function will allow us to create an implicitly Picked object 🎉
 * We still have type safety & ability to refactor (change/remove) props.
 * HOWEVER it seems that we lost our auto completion (CTRL + SPACE) to populate our object.
 * We only get TS errors/messages if things go wrong... but no information when creating the object
 *
 * This is okay, but I think we can do better 😎
 */
const buildImplicitPickVer1 =
  <T>() =>
  <K extends keyof T>(props: Pick<T, K>): Pick<T, K> =>
    props;
const implicitProductPickVer1 = buildImplicitPickVer1<Product>();
const implicitPickVer1 = implicitProductPickVer1({
  // TRY IT - (CTRL + SPACE) does not give us any auto completion for props we can use
  id: "1",
  price: 5.0,
  name: "bread",
  category: "Bakery & Cakes",
});
type ImplicitPickVer1Type = typeof implicitPickVer1; // { id: string, price: number, name: string, category: string }
type ImplicitPickVer1PropType = typeof implicitPickVer1.name; // string
//#endregion

//#region Implicit Pick Version 2 - with auto completion!
/**
 * Awesome! We now have an implicit Pick builder with auto completion
 * The magic difference: the intersection type for the function input/parameter
 *
 * The partial allows the consumer to pass in props & provide the auto complete.
 * Intersecting it will reduce the type/make the type specific (only the types shared between two types are used)
 */
const buildImplicitPickVer2 =
  <T>() =>
  <K extends keyof T>(props: Partial<T> & Pick<T, K>): Pick<T, K> =>
    props;

const implicitProductPickVer2 = buildImplicitPickVer2<Product>();
const implicitPickVer2 = implicitProductPickVer2({
  id: "1",
  price: 5.0,
  name: "bread",
  category: "Bakery & Cakes",
});
//#endregion
