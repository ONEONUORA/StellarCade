
import { render, screen } from '@testing-library/react';
import {
    SkeletonBase,
    SkeletonCard,
    SkeletonRow,
    SkeletonList,
    LoadingState,
} from '../../../src/components/v1/LoadingSkeletonSet';
import { parseDimension, classNames } from '../../../src/utils/v1/skeletonUtils';

describe('skeletonUtils', () => {
    it('parses dimension correctly', () => {
        expect(parseDimension(50)).toBe('50px');
        expect(parseDimension('100%')).toBe('100%');
        expect(parseDimension(undefined)).toBeUndefined();
    });

    it('joins classNames correctly', () => {
        expect(classNames('a', 'b')).toBe('a b');
        expect(classNames('a', undefined, null, false, 'c')).toBe('a c');
    });
});

describe('LoadingSkeletonSet Components', () => {
    it('renders SkeletonBase with default and custom styles', () => {
        render(<SkeletonBase width="100px" height={50} borderRadius="50%" />);
        const el = screen.getByTestId('skeleton-base');
        expect(el.className).toContain('stellarcade-skeleton-base');
        expect(el.style.width).toBe('100px');
        expect(el.style.height).toBe('50px');
        expect(el.style.borderRadius).toBe('50%');
    });

    it('renders SkeletonCard with generic structure', () => {
        render(<SkeletonCard />);
        const card = screen.getByTestId('skeleton-card');
        expect(card).toBeTruthy();
        expect(card.children.length).toBeGreaterThan(0);
    });

    it('renders SkeletonCard with custom children', () => {
        render(
            <SkeletonCard>
                <span data-testid="custom-child">Testing</span>
            </SkeletonCard>
        );
        expect(screen.getByTestId('custom-child')).toBeTruthy();
    });

    it('renders SkeletonRow with correct avatar sizing', () => {
        render(<SkeletonRow avatarSize="60px" />);
        const row = screen.getByTestId('skeleton-row');
        expect(row).toBeTruthy();
    });

    it('renders SkeletonList with correct lengths and types', () => {
        render(<SkeletonList count={5} type="card" />);
        const list = screen.getByTestId('skeleton-list');
        expect(list.children.length).toBe(5);
        expect(screen.getAllByTestId('skeleton-card').length).toBe(5);
    });
});

describe('LoadingState Conditional Rendering', () => {
    it('renders error state when error is provided', () => {
        render(
            <LoadingState isLoading={true} error={new Error('Test error')} empty={false}>
                <div data-testid="content">Content</div>
            </LoadingState>
        );
        expect(screen.getByTestId('skeleton-error').textContent).toContain('Failed to load data: Test error');
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('renders loading state when isLoading is true without error', () => {
        render(
            <LoadingState isLoading={true} empty={false}>
                <div data-testid="content">Content</div>
            </LoadingState>
        );
        expect(screen.getByTestId('skeleton-list')).toBeTruthy();
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('renders empty state when empty is true and no loading/error', () => {
        render(
            <LoadingState isLoading={false} empty={true}>
                <div data-testid="content">Content</div>
            </LoadingState>
        );
        expect(screen.getByTestId('skeleton-empty').textContent).toContain('No data available');
        expect(screen.queryByTestId('content')).toBeNull();
    });

    it('renders content when not loading, no error, and not empty', () => {
        render(
            <LoadingState isLoading={false} empty={false}>
                <div data-testid="content">Loaded Content</div>
            </LoadingState>
        );
        expect(screen.getByTestId('content').textContent).toContain('Loaded Content');
        expect(screen.queryByTestId('skeleton-list')).toBeNull();
    });

    it('uses custom fallbacks properly', () => {
        render(
            <LoadingState
                isLoading={false}
                error={new Error('custom')}
                errorFallback={() => <span data-testid="custom-error">Custom</span>}
            >
                <div data-testid="content">Content</div>
            </LoadingState>
        );
        expect(screen.getByTestId('custom-error')).toBeTruthy();
    });
});
