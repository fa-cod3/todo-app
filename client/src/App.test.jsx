import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';
import App from './App';
import { createLocalStore } from './api';

function setup() {
  const user = userEvent.setup();
  render(<App store={createLocalStore(localStorage)} />);
  const addTodo = async (title) => {
    await user.type(screen.getByLabelText('New todo'), `${title}{Enter}`);
    await screen.findByText(title);
  };
  const titles = () => screen.queryAllByRole('listitem').map((li) => li.textContent.replace(/EditDelete$/, ''));
  return { user, addTodo, titles };
}

describe('App', () => {
  test('shows an empty state', async () => {
    setup();
    expect(await screen.findByText(/Nothing to do yet/)).toBeInTheDocument();
  });

  test('adds todos and ignores blank input', async () => {
    const { user, addTodo, titles } = setup();
    await screen.findByText(/Nothing to do yet/);

    await addTodo('Buy milk');
    await addTodo('Walk the dog');
    await user.type(screen.getByLabelText('New todo'), '   {Enter}');

    expect(titles()).toEqual(['Buy milk', 'Walk the dog']);
    expect(screen.getByText('2 items left')).toBeInTheDocument();
    expect(screen.getByLabelText('New todo')).toHaveValue('   ');
  });

  test('toggles, filters and clears completed todos', async () => {
    const { user, addTodo, titles } = setup();
    await addTodo('First');
    await addTodo('Second');

    await user.click(screen.getByLabelText('Mark "First" as completed'));
    expect(await screen.findByText('1 item left')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'active' }));
    expect(titles()).toEqual(['Second']);

    await user.click(screen.getByRole('button', { name: 'completed' }));
    expect(titles()).toEqual(['First']);

    await user.click(screen.getByRole('button', { name: 'all' }));
    await user.click(screen.getByRole('button', { name: 'Clear completed' }));
    await screen.findByText('Second');
    expect(titles()).toEqual(['Second']);
  });

  test('edits a todo with Enter and cancels with Escape', async () => {
    const { user, addTodo, titles } = setup();
    await addTodo('Draft');

    await user.dblClick(screen.getByText('Draft'));
    const input = screen.getByLabelText('Edit todo');
    await user.clear(input);
    await user.type(input, 'Final{Enter}');
    expect(await screen.findByText('Final')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Edit "Final"' }));
    await user.type(screen.getByLabelText('Edit todo'), ' changed{Escape}');
    expect(titles()).toEqual(['Final']);
  });

  test('deletes a todo', async () => {
    const { user, addTodo, titles } = setup();
    await addTodo('Keep');
    await addTodo('Remove');

    const item = screen.getByText('Remove').closest('li');
    await user.click(within(item).getByRole('button', { name: /Delete/ }));

    expect(titles()).toEqual(['Keep']);
  });

  test('persists todos across reloads in demo mode', async () => {
    const { addTodo } = setup();
    await addTodo('Persist me');
    cleanup();

    render(<App store={createLocalStore(localStorage)} />);
    expect(await screen.findByText('Persist me')).toBeInTheDocument();
  });

  test('shows API errors', async () => {
    const failingStore = {
      list: async () => {
        throw new Error('Could not reach the server');
      },
    };
    render(<App store={failingStore} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not reach the server');
  });
});
