export const WARNINGS = {
  propChange: (prop: string) =>
    `You shouldn't change the '${prop}' prop on the fly. It can break the current state of the sortable component.`
};
