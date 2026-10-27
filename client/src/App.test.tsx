import {describe,it,expect} from 'vitest';
import {render,screen} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import App from './App';

describe('landing page',()=>{
  it('introduces the fictional investigation game and offers a start action',()=>{
    render(<MemoryRouter><App/></MemoryRouter>);
    expect(screen.getByRole('heading',{name:/every clue leaves/i})).toBeInTheDocument();
    expect(screen.getByRole('link',{name:/open a new case/i})).toHaveAttribute('href','/create');
    expect(screen.getByText(/fictional investigations only/i)).toBeInTheDocument();
  });
});
