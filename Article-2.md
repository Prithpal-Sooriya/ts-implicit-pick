# How to Correctly Type React DefaultProps.

**TAGS**: TypeScript, React, Components, Default Props, Bugs

## Situation/Background

We have inherited an old complex class-based component that took an array of items and rendered them.
It had a similar structure to this:

```ts
export interface ListProps {
  items: string[];
  filterPredicate?: (item: string) => boolean;
  onSelect?: (item: string) => void;
  onMultiSelect?: (items: string[]) => void;
  createKey?: (item: string, index: number) => string;
  // ... a lot of props
}
class List extends React.Component<ListProps> {
  static defaultProps: Partial<ListProps> = {
    // defaults for most props except `items`
    // because we want it will always be required right??
  };
}
```

This component was treated as an atomic component and, since it has stuck around for ~3 years, a lot of other components have used it to build their UI's.

This component did not lack tests, it was quite thoroughly tested. Again the test structure looked similar to this:

```ts
import { ListProps } from "./ListComponent";
// ...
const testProps: ListProps = {
  items: [
    /*...*/
  ],
  // ...
};
// Then some enzyme tests using props
// NOTE that all tests were strictly typed & used the exported ListProps type to create the test props
```

## Back to the present

Some new logic was added to one of these components that inherited the List component.

Everything was working as expected until we hit our **_favourite_** runtime error:\
`Cannot read property 'length' of undefined`

But why?? Everything was strictly typed, how did this fall through?

It turned out this new logic could potentially return an undefined list of items (`string[] | undefined`). But TypeScript should have picked this up when we used it as a prop for our List component, so why did we not get any errors about this?

## Default Props and Merged Props.

The type `ListProps` for our component is NOT the true & final prop types when we are instantiating the new JSX List element. It merges the props we provide it at the start (the `extends React.Component<ListProps>`) with the `typeof defaultProps`.

Here it is in the [DefinitelyTyped repo](https://github.com/DefinitelyTyped/DefinitelyTyped/blob/ca8eefc03c4553f3bda93b4ab33a3e504f18cfb4/types/react/v16/index.d.ts#L3027), but a simplified version is shown below:

```ts
// simplified version of the DefinitelyTyped - Defaultize utility
// Under the hood, the merge takes:
// - the default props (and makes them all optional),
// - and the remaining original props
MergeProps<Props, DefaultProps> =
  Partial<DefaultProps> &
  Omit<Props, keyof DefaultProps>
```

So what is the type of our default props? Thats right we strictly made it `Partial`!
So plugging this in the `MergeProps` utility, we can see it makes all of our props optional.

```ts
type FinalProps = MergeProps<ListProps, Partial<ListProps>>;
// this returns string | undefined! Proof that our items have become optional!
type Items = FinalProps["items"];

// Proof Identity - the above merged props is the same as Partial of all props.
// A = B -> true
type Identity1 = FinalProps extends Partial<ListProps> ? true : false;
// B = A -> true
type Identity2 = Partial<ListProps> extends FinalProps ? true : false;
// (A = B) & (B = A) -> true! It is identical.
type IdentityProof = Identity1 & Identity2;
```

So our final props are optional/`Partial`. You can even see via IntelliSense:\
![JSX Component where props have become partial](https://raw.githubusercontent.com/Prithpal-Sooriya/ts-implicit-pick/main/images/PartialDefaultPropTypes.png)

This is also the reason why we didn't see this in our tests - we were relying too much on our exported `ListProps` type, when in actuality we should have tested with this merged type to cover these missed test cases!

Whats worse is that this pattern was used in a lot of other legacy class components. What are we going to do 😬😬😬?

## Fixing our Default Props!

We want our `defaultProps` to be strictly typed, it follows our developer standards & we want to have that wonderful IntelliSense, type safety & ability to easily refactor our props.

After some reading, one of the recommended ways of typing it is to split out our Large interface into smaller interfaces & merge them:

```ts
interface RawProps {
  items: string[]
}
interface DefaultProps {
  onSelect?: (item: string) => void
  //...
}
//...
static defaultProps: DefaultProps = {/* yay Typesafety, IntelliSense & Refactoring */}
```

However this wasn't really feasible for this old component - it already had a huge list of props & decoupling would have taken quite a lot of time (especially for all the other legacy components).

Instead we can `Pick` our default props, and using a utility, we can correctly infer our `Pick` type (instead of manually writing a large `Pick`) & still have our wonderful IntelliSense/Type Safety/Ability to Refactor.

```ts
// implicit pick utility
const buildImplicitPick =
  <T>() =>
  <K extends keyof T>(props: Partial<T> & Pick<T, K>): Pick<T, K> =>
    props;

const defaultListProps = buildImplicitPick<ListProps>();

//...
static defaultProps = defaultListProps({/* yay Typesafety, IntelliSense & Refactoring */})
```

See my related article for more information\
https://dev.to/prithpalsooriya/how-to-create-a-type-safe-implicit-pick-2jpa

## Conclusion

TypeScript is super powerful and can resolve most mistakes that could appear are runtime right as your are typing - a very small feedback loop!\
However bad types & relying too much on strict, predefined types can blindside us/introduce type holes where we lose our type safety.

It was understandable why this happened on these legacy components, since it was also our first time using TypeScript.\
In the future we can mitigate the above by spending time to ensure that the type we get/want to use is correct & even introduce type tests to validate our types.

Here is a Code Sandbox Link to show the problems and solutions mentioned.\
https://codesandbox.io/s/xenodochial-framework-tq7dx?file=/src/App.tsx

Now back to fixing these new TS errors 🙃.
