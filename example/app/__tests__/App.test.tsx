import { render } from '@testing-library/react-native';
import App from '../src/App';

describe(App, () => {
  it('renders', () => {
    render(<App />);
  });
});
