import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import TeamList from '../TeamList';
import { teamsAPI } from '../../services/api';

// Mock the API
jest.mock('../../services/api', () => ({
  teamsAPI: {
    getAll: jest.fn(),
  },
}));

const mockTeams = [
  {
    _id: 'team1',
    name: 'Brazil',
    country: 'Brazil',
    flag: '/uploads/brazil-flag.png',
    group: 'A',
    productCount: 3,
  },
  {
    _id: 'team2',
    name: 'Germany',
    country: 'Germany',
    flag: '/uploads/germany-flag.png',
    group: 'B',
    productCount: 2,
  },
];

const mockPagination = {
  total: 2,
  page: 1,
  limit: 12,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const renderTeamList = (props = {}) => {
  return render(
    <BrowserRouter>
      <TeamList {...props} />
    </BrowserRouter>
  );
};

describe('TeamList', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    teamsAPI.getAll.mockResolvedValue({
      data: { data: mockTeams, pagination: mockPagination },
    });
  });

  it('renders team cards after loading', async () => {
    renderTeamList();
    await waitFor(() => {
      expect(screen.getByText('Brazil')).toBeInTheDocument();
      expect(screen.getByText('Germany')).toBeInTheDocument();
    });
  });

  it('shows skeleton loaders while loading', () => {
    teamsAPI.getAll.mockImplementation(() => new Promise(() => {})); // Never resolves
    renderTeamList({ limit: 4 });
    // Skeletons should be present
    const skeletons = document.querySelectorAll('.team-card-skeleton');
    expect(skeletons.length).toBe(4);
  });

  it('shows error message on API failure', async () => {
    teamsAPI.getAll.mockRejectedValue({
      response: { data: { error: 'Server error' } },
    });
    renderTeamList();
    await waitFor(() => {
      expect(screen.getByText('Error loading teams')).toBeInTheDocument();
    });
  });

  it('shows empty state when no teams found', async () => {
    teamsAPI.getAll.mockResolvedValue({
      data: { data: [], pagination: { ...mockPagination, total: 0 } },
    });
    renderTeamList();
    await waitFor(() => {
      expect(screen.getByText('No teams found')).toBeInTheDocument();
    });
  });

  it('renders search input when showFilters is true', async () => {
    renderTeamList({ showFilters: true });
    expect(screen.getByLabelText('Search teams')).toBeInTheDocument();
  });

  it('does not render filters when showFilters is false', () => {
    renderTeamList({ showFilters: false });
    expect(screen.queryByLabelText('Search teams')).not.toBeInTheDocument();
  });

  it('calls API with search param when searching', async () => {
    renderTeamList({ showFilters: true });
    await waitFor(() => screen.getByText('Brazil'));

    const searchInput = screen.getByLabelText('Search teams');
    fireEvent.change(searchInput, { target: { value: 'Brazil' } });

    await waitFor(() => {
      expect(teamsAPI.getAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Brazil' })
      );
    });
  });
});
