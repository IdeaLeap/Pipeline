import { replaceSlots } from "@idealeap/pipeline";

test("replaceSlots", () => {
  const testObj = {
    text: "Hello {{name}}",
    info: {
      age: "{{age}} years old",
      address: "{{addressObj.city}}124453",
      others: "{{addressObj}}",
    },
  };

  const replacements = {
    name: "Alice",
    age: "25",
    addressObj: {
      street: "123 Main St",
      city: "Example City",
    },
  };

  console.log(replaceSlots(testObj, replacements));
  expect(replaceSlots(testObj, replacements)).toEqual({
    text: "Hello Alice",
    info: {
      age: "25 years old",
      address: "Example City124453",
      others: { street: "123 Main St", city: "Example City" },
    },
  });
  debugger;
});
