/* eslint-disable jsx-a11y/label-has-associated-control */
/* eslint-disable jsx-a11y/control-has-associated-label */
import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  addNewTodo,
  changeTodoStatus,
  deleteTodo,
  getTodos,
  USER_ID,
} from './api/todos';
import { TodoHeader } from './components/TodoHeader';
import { TodoList } from './components/TodoList';
import { TodoFooter } from './components/TodoFooter';
import { Todo } from './types/Todo';
import { TodoItem } from './components/TodoItem';

export const App: React.FC = () => {
  const [newTodo, setNewTodo] = useState('');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [errorMessage, setErrorMessage] = useState('');

  const [tempTodo, setTempTodo] = useState<Todo | null>(null);

  const [isAdding, setIsAdding] = useState(false);
  const [loadingTodoId, setLoadingTodoId] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => {
        setErrorMessage('Unable to load todos');
      });
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!USER_ID) {
    return <UserWarning />;
  }

  const filteredTodos = todos?.filter(todo => {
    if (filter === 'active') {
      return !todo.completed;
    }

    if (filter === 'completed') {
      return todo.completed;
    }

    return true;
  });

  const handleAddTodo = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!newTodo.trim()) {
      setErrorMessage('Title should not be empty');

      return;
    }

    setIsAdding(true);

    const temp = {
      id: 0,
      userId: USER_ID,
      title: newTodo.trim(),
      completed: false,
    };

    setTempTodo(temp);

    try {
      const createdTodo = await addNewTodo({
        userId: USER_ID,
        title: newTodo.trim(),
        completed: false,
      });

      setNewTodo('');

      setTodos(prev => [...prev, createdTodo]);

      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    } catch (err) {
      setErrorMessage('Unable to add a todo');
    } finally {
      setIsAdding(false);
      setTempTodo(null);
    }
  };

  const handleDeleteTodo = async (id: number) => {
    try {
      await deleteTodo(id);
      const updatedTodos = await getTodos();

      setTodos(updatedTodos);
    } catch (err) {
      setErrorMessage('Unable to delete a todo');
    }
  };

  const handleStatusTodo = async (id: number, status: boolean) => {
    setLoadingTodoId(id);

    setTodos(prevTodos =>
      prevTodos.map(todo =>
        todo.id === id ? { ...todo, completed: status } : todo,
      ),
    );

    try {
      await changeTodoStatus(id, status);
    } catch (err) {
      setErrorMessage('Unable to update a todo');

      setTodos(prevTodos =>
        prevTodos.map(todo =>
          todo.id === id ? { ...todo, completed: !status } : todo,
        ),
      );
    } finally {
      setLoadingTodoId(null);
    }
  };

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>

      <div className="todoapp__content">
        <TodoHeader
          newTodo={newTodo}
          setNewTodo={setNewTodo}
          onSubmit={handleAddTodo}
          isDisabled={isAdding}
          inputRef={inputRef}
          setErrorMessage={setErrorMessage}
          
        />

        <TodoList
          todos={filteredTodos}
          onDelete={handleDeleteTodo}
          onStatusUpdate={handleStatusTodo}
          loadingTodoId={loadingTodoId}
        />

        {tempTodo && (
          <TodoItem
            onDelete={handleDeleteTodo}
            todo={tempTodo}
            isLoading
            onStatusUpdate={handleStatusTodo}
          />
        )}

        {/* Hide the footer if there are no todos */}
        <TodoFooter todos={todos} filter={filter} setFilter={setFilter} />
      </div>

      {/* DON'T use conditional rendering to hide the notification */}
      {/* Add the 'hidden' class to hide the message smoothly */}
      <div
        data-cy="ErrorNotification"
        className={`
    notification is-danger is-light has-text-weight-normal
    ${!errorMessage ? 'hidden' : ''}
  `}
      >
        <button
          data-cy="HideErrorButton"
          type="button"
          className="delete"
          onClick={() => setErrorMessage('')}
        />
        {errorMessage}
      </div>
    </div>
  );
};
