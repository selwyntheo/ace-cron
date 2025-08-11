import React, { useState, useCallback, useMemo, startTransition, useDeferredValue } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Paper,
  Grid,
  Container,
  ThemeProvider,
  createTheme,
  CssBaseline,
  ToggleButton,
  ToggleButtonGroup,
  Fade,
  Slide,
  Stack,
  Avatar,
  Divider
} from '@mui/material';
import {
  WbSunny,
  Event,
  BarChart,
  Settings,
  Schedule,
  Today,
  Tune,
  AccessTime,
  Lightbulb
} from '@mui/icons-material';

// Type definitions
interface CronConfig {
  type: 'daily' | 'weekly' | 'monthly' | 'custom';
  time?: string;
  days?: number[];
  day?: number;
  expression?: string;
}

interface CronBuilderProps {
  value?: string;
  onChange: (expression: string) => void;
}

interface CronDisplayProps {
  expression: string;
}

// Custom Material-UI theme
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#2563eb',
      light: '#3b82f6',
      dark: '#1d4ed8',
    },
    secondary: {
      main: '#7c3aed',
      light: '#8b5cf6',
      dark: '#6d28d9',
    },
    background: {
      default: '#f8fafc',
      paper: 'rgba(255, 255, 255, 0.8)',
    },
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
    },
  },
  shape: {
    borderRadius: 4,
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 300,
      letterSpacing: '-0.02em',
    },
    h6: {
      fontWeight: 500,
      letterSpacing: '0.02em',
    },
    body2: {
      letterSpacing: '0.02em',
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(20px)',
          background: 'rgba(255, 255, 255, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(10px)',
          background: 'rgba(255, 255, 255, 0.4)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 12,
          padding: '10px 20px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backdropFilter: 'blur(10px)',
            background: 'rgba(255, 255, 255, 0.6)',
          },
        },
      },
    },
  },
});

// Utility functions for cron parsing and generation
const cronUtils = {
  parseExpression: (cron: string): CronConfig | null => {
    const parts = cron.split(' ');
    if (parts.length !== 5) return null;
    
    const [minute, hour, day, month, weekday] = parts;
    
    if (minute === '0' && hour === '0' && day === '*' && month === '*' && weekday === '*') {
      return { type: 'daily', time: '00:00' };
    }
    
    if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && weekday === '*') {
      return { 
        type: 'daily', 
        time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}` 
      };
    }
    
    if (minute !== '*' && hour !== '*' && day === '*' && month === '*' && weekday !== '*') {
      const days = weekday.split(',').map((d: string) => parseInt(d));
      return { 
        type: 'weekly', 
        time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
        days 
      };
    }
    
    if (minute !== '*' && hour !== '*' && day !== '*' && month === '*' && weekday === '*') {
      return { 
        type: 'monthly', 
        time: `${hour.padStart(2, '0')}:${minute.padStart(2, '0')}`,
        day: parseInt(day)
      };
    }
    
    return { type: 'custom', expression: cron };
  },
  
  generateExpression: (config: CronConfig): string => {
    const { type, time, days, day } = config;
    const [hour, minute] = (time || '00:00').split(':').map((t: string) => parseInt(t));
    
    switch (type) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        const daysList = (days || []).join(',');
        return `${minute} ${hour} * * ${daysList}`;
      case 'monthly':
        return `${minute} ${hour} ${day || 1} * *`;
      case 'custom':
        return config.expression || '0 0 * * *';
      default:
        return '0 0 * * *';
    }
  },
  
  humanReadable: (cron: string): string => {
    const config = cronUtils.parseExpression(cron);
    if (!config) return 'Invalid cron expression';
    
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    switch (config.type) {
      case 'daily':
        return `Daily at ${config.time}`;
      case 'weekly':
        const daysList = (config.days || []).map((d: number) => dayNames[d]).join(', ');
        return `Weekly on ${daysList} at ${config.time}`;
      case 'monthly':
        const suffix = config.day === 1 ? 'st' : config.day === 2 ? 'nd' : config.day === 3 ? 'rd' : 'th';
        return `Monthly on the ${config.day}${suffix} at ${config.time}`;
      case 'custom':
        return `Custom: ${config.expression}`;
      default:
        return 'Invalid schedule';
    }
  }
};

// Main CronBuilder component using MUI with React 19 features
const CronBuilder: React.FC<CronBuilderProps> = ({ 
  value = '0 0 * * *', 
  onChange 
}) => {
  const config = useMemo(() => {
    return cronUtils.parseExpression(value) || { type: 'daily' as const, time: '00:00' };
  }, [value]);
  
  const [scheduleType, setScheduleType] = useState<string>(config.type);
  const [time, setTime] = useState(config.time || '00:00');
  const [selectedDays, setSelectedDays] = useState<number[]>((config as any).days || []);
  const [monthDay, setMonthDay] = useState((config as any).day || 1);
  const [customExpression, setCustomExpression] = useState((config as any).expression || '0 0 * * *');
  
  // Use React 19's useDeferredValue for better performance
  const deferredScheduleType = useDeferredValue(scheduleType);
  
  const updateCron = useCallback((newConfig: CronConfig) => {
    // Use React 19's startTransition for non-urgent updates
    startTransition(() => {
      const expression = cronUtils.generateExpression(newConfig);
      onChange(expression);
    });
  }, [onChange]);
  
  const handleTypeChange = (event: React.MouseEvent<HTMLElement>, newType: string | null) => {
    if (newType !== null) {
      setScheduleType(newType);
      const newConfig: CronConfig = { 
        type: newType as CronConfig['type'], 
        time, 
        days: selectedDays, 
        day: monthDay, 
        expression: customExpression 
      };
      updateCron(newConfig);
    }
  };
  
  const handleTimeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = event.target.value;
    setTime(newTime);
    const newConfig: CronConfig = { 
      type: scheduleType as CronConfig['type'], 
      time: newTime, 
      days: selectedDays, 
      day: monthDay 
    };
    updateCron(newConfig);
  };
  
  const toggleDay = (dayIndex: number) => {
    const newDays = selectedDays.includes(dayIndex)
      ? selectedDays.filter((d: number) => d !== dayIndex)
      : [...selectedDays, dayIndex].sort();
    
    setSelectedDays(newDays);
    const newConfig: CronConfig = { 
      type: scheduleType as CronConfig['type'], 
      time, 
      days: newDays, 
      day: monthDay 
    };
    updateCron(newConfig);
  };
  
  const handleMonthDayChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newDay = parseInt(event.target.value);
    setMonthDay(newDay);
    const newConfig: CronConfig = { 
      type: scheduleType as CronConfig['type'], 
      time, 
      days: selectedDays, 
      day: newDay 
    };
    updateCron(newConfig);
  };
  
  const handleCustomExpressionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const expression = event.target.value;
    setCustomExpression(expression);
    const newConfig: CronConfig = { type: 'custom', expression };
    updateCron(newConfig);
  };
  
  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const scheduleTypes = [
    { key: 'daily', label: 'Daily', icon: <WbSunny /> },
    { key: 'weekly', label: 'Weekly', icon: <Event /> },
    { key: 'monthly', label: 'Monthly', icon: <BarChart /> },
    { key: 'custom', label: 'Custom', icon: <Settings /> }
  ];
  
  return (
    <Card elevation={0} sx={{ borderRadius: 4 }}>
      <CardContent sx={{ p: 4 }}>
        <Stack spacing={4}>
          {/* Header */}
          <Box textAlign="center">
            <Typography variant="h5" component="h2" fontWeight={300} gutterBottom>
              Schedule Builder
            </Typography>
            <Box 
              sx={{ 
                width: 48, 
                height: 2, 
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)', 
                mx: 'auto',
                borderRadius: 1
              }} 
            />
          </Box>
          
          {/* Schedule Type Selection */}
          <Box>
            <Typography variant="body2" color="text.secondary" fontWeight={500} mb={2}>
              Frequency
            </Typography>
            <ToggleButtonGroup
              value={deferredScheduleType}
              exclusive
              onChange={handleTypeChange}
              sx={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 1,
                '& .MuiToggleButton-root': {
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  py: 1.5,
                  '&.Mui-selected': {
                    bgcolor: 'primary.main',
                    color: 'white',
                    '&:hover': {
                      bgcolor: 'primary.dark',
                    }
                  }
                }
              }}
            >
              {scheduleTypes.map(({ key, label, icon }) => (
                <ToggleButton key={key} value={key}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {icon}
                    <Typography variant="body2" fontWeight={500}>
                      {label}
                    </Typography>
                  </Stack>
                </ToggleButton>
              ))}
            </ToggleButtonGroup>
          </Box>

          {/* Time Selection */}
          {(deferredScheduleType === 'daily' || deferredScheduleType === 'weekly' || deferredScheduleType === 'monthly') && (
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={500} mb={2}>
                Time
              </Typography>
              <TextField
                type="time"
                value={time}
                onChange={handleTimeChange}
                size="small"
                sx={{ width: '140px' }}
              />
            </Box>
          )}

          {/* Weekly Day Selection */}
          {deferredScheduleType === 'weekly' && (
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={500} mb={2}>
                Days of Week
              </Typography>
              <Stack direction="row" spacing={1}>
                {dayNames.map((day, index) => (
                  <Button
                    key={index}
                    variant={selectedDays.includes(index) ? 'contained' : 'outlined'}
                    onClick={() => toggleDay(index)}
                    size="small"
                    sx={{
                      minWidth: 36,
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      p: 0
                    }}
                  >
                    {day}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}

          {/* Monthly Day Selection */}
          {deferredScheduleType === 'monthly' && (
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={500} mb={2}>
                Day of Month
              </Typography>
              <TextField
                type="number"
                value={monthDay}
                onChange={handleMonthDayChange}
                size="small"
                inputProps={{ min: 1, max: 31 }}
                sx={{ width: '80px' }}
              />
            </Box>
          )}

          {/* Custom Expression */}
          {deferredScheduleType === 'custom' && (
            <Box>
              <Typography variant="body2" color="text.secondary" fontWeight={500} mb={2}>
                Cron Expression
              </Typography>
              <TextField
                value={customExpression}
                onChange={handleCustomExpressionChange}
                placeholder="0 0 * * *"
                size="small"
                fullWidth
                sx={{ fontFamily: 'monospace' }}
              />
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

// Display component for the current cron expression
const CronDisplay: React.FC<CronDisplayProps> = ({ expression }) => {
  const readable = cronUtils.humanReadable(expression);
  
  return (
    <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
      <Stack spacing={2}>
        <Stack direction="row" spacing={1} alignItems="center">
          <AccessTime color="primary" fontSize="small" />
          <Typography variant="body2" color="text.secondary" fontWeight={500}>
            Current Schedule
          </Typography>
        </Stack>
        <Chip
          label={expression}
          size="small"
          sx={{
            fontFamily: 'monospace',
            bgcolor: 'text.primary',
            color: 'white',
            fontSize: '0.75rem'
          }}
        />
      </Stack>
      <Typography variant="body1" color="text.primary" fontWeight={500}>
        {readable}
      </Typography>
    </Paper>
  );
};

// Demo component with MUI theme - Enhanced with React 19 features
// - Uses useDeferredValue for better performance on type changes
// - Uses startTransition for non-urgent cron expression updates
const CronBuilderDemo: React.FC = () => {
  const [cronExpression, setCronExpression] = useState('0 9 * * 1,3,5');
  
  const examples = [
    { cron: '0 9 * * *', desc: 'Daily at 9:00 AM' },
    { cron: '30 14 * * 1,3,5', desc: 'Mon, Wed, Fri at 2:30 PM' },
    { cron: '0 0 15 * *', desc: 'Monthly on 15th at midnight' }
  ];
  
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 50%, #cbd5e1 100%)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Animated background elements */}
        <Box
          sx={{
            position: 'fixed',
            top: -200,
            right: -200,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 6s ease-in-out infinite'
          }}
        />
        <Box
          sx={{
            position: 'fixed',
            bottom: -200,
            left: -200,
            width: 400,
            height: 400,
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite reverse'
          }}
        />
        
        <Container maxWidth="md" sx={{ py: 8, position: 'relative', zIndex: 1 }}>
          <Stack spacing={6}>
            {/* Hero section */}
            <Box textAlign="center">
              <Stack spacing={3}>
                <Typography variant="h3" component="h1" fontWeight={300} color="text.primary">
                  Cron
                  <Box component="span" sx={{ 
                    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    fontWeight: 500,
                    ml: 1
                  }}>
                    Builder
                  </Box>
                </Typography>
                <Typography variant="h6" color="text.secondary" fontWeight={300}>
                  Create beautiful schedules with Material Design
                </Typography>
                <Stack direction="row" spacing={2} justifyContent="center">
                  <Avatar sx={{ bgcolor: 'primary.main' }}>
                    <Schedule />
                  </Avatar>
                  <Avatar sx={{ bgcolor: 'secondary.main' }}>
                    <Event />
                  </Avatar>
                  <Avatar sx={{ bgcolor: 'success.main' }}>
                    <Today />
                  </Avatar>
                </Stack>
              </Stack>
            </Box>
            
            {/* Main builder */}
            <Fade in timeout={800}>
              <Box>
                <CronBuilder
                  value={cronExpression}
                  onChange={setCronExpression}
                />
              </Box>
            </Fade>
            
            {/* Display and Examples */}
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <CronDisplay expression={cronExpression} />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                  <Stack direction="row" spacing={1} alignItems="center" mb={3}>
                    <Lightbulb color="warning" fontSize="small" />
                    <Typography variant="body2" color="text.secondary" fontWeight={500}>
                      Examples
                    </Typography>
                  </Stack>
                  
                  <Stack spacing={2}>
                    {examples.map(({ cron, desc }, index) => (
                      <Card
                        key={index}
                        elevation={0}
                        sx={{
                          p: 2,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease-in-out',
                          background: 'rgba(255, 255, 255, 0.6)',
                          '&:hover': {
                            background: 'rgba(255, 255, 255, 0.9)',
                            transform: 'translateY(-2px)',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                          }
                        }}
                        onClick={() => setCronExpression(cron)}
                      >
                        <Typography variant="body2" fontFamily="monospace" color="primary.main" gutterBottom>
                          {cron}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {desc}
                        </Typography>
                      </Card>
                    ))}
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </Container>
        
        {/* Global styles for animations */}
        <style>
          {`
            @keyframes float {
              0%, 100% { transform: translateY(0px) rotate(0deg); }
              50% { transform: translateY(-20px) rotate(5deg); }
            }
          `}
        </style>
      </Box>
    </ThemeProvider>
  );
};

export default CronBuilderDemo;
export { CronBuilder, CronDisplay, cronUtils };