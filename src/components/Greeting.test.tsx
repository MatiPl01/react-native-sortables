import { render } from '@testing-library/react-native';

import Greeting from './Greeting';

describe(Greeting, () => {
  it('renders', () => {
    const tree = render(<Greeting />);

    expect(tree).toMatchSnapshot();
  });
});
