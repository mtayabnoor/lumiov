import { Box } from '@mui/material';
import { ReactNode } from 'react';
import PageHeader from '../PageHeader/PageHeader';

interface PageLayoutProps {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}

const PageLayout = ({ title, description, children, actions }: PageLayoutProps) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0, // Critical for Electron flex scrolling
        overflow: 'hidden',
        p: 0,
      }}
    >
      {/* FIXED HEADER */}
      <Box
        sx={{
          px: 3,
          pt: 3,
          pb: 2,
          flexShrink: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <PageHeader title={title} description={description || ''} />
        {actions && <Box>{actions}</Box>}
      </Box>

      {/* CONTENT AREA - no scroll here, children handle their own scrolling */}
      <Box
        sx={{
          flexGrow: 1,
          minHeight: 0, // Critical for Electron flex scrolling
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden', // Don't scroll here - let children scroll
          px: 3,
          pb: 3,
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default PageLayout;
