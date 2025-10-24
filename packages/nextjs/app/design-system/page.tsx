"use client";

import {
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  CheckCircleIcon,
  HeartIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  Alert,
  Avatar,
  AvatarGroup,
  Badge,
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Loading,
  Section,
  SectionHeader,
  Stat,
  StatsContainer,
} from "~~/components/ui";
import { typography } from "~~/styles/design-system";

/**
 * Design System Showcase Page
 * Demonstrates all available UI components and their variations
 */
export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-base-200 pb-12">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary to-secondary text-primary-content py-16">
        <div className="container mx-auto max-w-6xl px-4">
          <h1 className={typography.h1}>Farcaster MiniApp Design System</h1>
          <p className="text-lg mt-4 opacity-90">Consistent, beautiful components built with DaisyUI and TailwindCSS</p>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 mt-8">
        {/* Typography */}
        <Section>
          <SectionHeader title="Typography" subtitle="Consistent text styles across the app" />
          <Card>
            <CardBody>
              <h1 className={typography.h1}>Heading 1 - Hero Title</h1>
              <h2 className={typography.h2}>Heading 2 - Section Title</h2>
              <h3 className={typography.h3}>Heading 3 - Subsection</h3>
              <h4 className={typography.h4}>Heading 4 - Card Title</h4>
              <p className={typography.body}>Body text - Regular content and descriptions</p>
              <p className={typography.bodySmall}>Small body text - Secondary content</p>
              <p className={typography.caption}>Caption text - Metadata and hints</p>
              <code className={typography.mono}>Monospace - Code and addresses</code>
            </CardBody>
          </Card>
        </Section>

        {/* Buttons */}
        <Section>
          <SectionHeader title="Buttons" subtitle="Interactive elements with various styles" />
          <Card>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Variants</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button variant="primary">Primary</Button>
                    <Button variant="secondary">Secondary</Button>
                    <Button variant="accent">Accent</Button>
                    <Button variant="ghost">Ghost</Button>
                    <Button variant="outline">Outline</Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Sizes</h4>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Button size="sm">Small</Button>
                    <Button size="md">Medium</Button>
                    <Button size="lg">Large</Button>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">States</h4>
                  <div className="flex flex-wrap gap-2">
                    <Button loading>Loading</Button>
                    <Button disabled>Disabled</Button>
                    <Button fullWidth>Full Width Button</Button>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Section>

        {/* Badges */}
        <Section>
          <SectionHeader title="Badges" subtitle="Labels and status indicators" />
          <Card>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Variants</h4>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="accent">Accent</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="info">Info</Badge>
                    <Badge variant="ghost">Ghost</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Sizes</h4>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge size="sm">Small</Badge>
                    <Badge size="md">Medium</Badge>
                    <Badge size="lg">Large</Badge>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Section>

        {/* Cards */}
        <Section>
          <SectionHeader title="Cards" subtitle="Content containers with different styles" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card variant="base">
              <CardHeader title="Base Card" subtitle="Default card style" />
              <CardBody>
                <p>This is the standard card with shadow and rounded corners.</p>
              </CardBody>
              <CardFooter>
                <Button size="sm">Action</Button>
              </CardFooter>
            </Card>

            <Card variant="compact">
              <CardHeader title="Compact Card" subtitle="Less shadow" />
              <CardBody>
                <p>More subtle appearance for secondary content.</p>
              </CardBody>
            </Card>

            <Card variant="bordered">
              <CardHeader title="Bordered Card" subtitle="With border" />
              <CardBody>
                <p>Uses border instead of shadow for definition.</p>
              </CardBody>
            </Card>

            <Card variant="glass">
              <CardHeader title="Glass Card" subtitle="Frosted glass effect" />
              <CardBody>
                <p>Semi-transparent with backdrop blur.</p>
              </CardBody>
            </Card>
          </div>
        </Section>

        {/* Alerts */}
        <Section>
          <SectionHeader title="Alerts" subtitle="Messages and notifications" />
          <div className="space-y-3">
            <Alert variant="info" title="Information">
              This is an informational message for the user.
            </Alert>
            <Alert variant="success" title="Success">
              Your operation completed successfully!
            </Alert>
            <Alert variant="warning" title="Warning">
              Please review this before continuing.
            </Alert>
            <Alert variant="error" title="Error">
              Something went wrong. Please try again.
            </Alert>
          </div>
        </Section>

        {/* Avatars */}
        <Section>
          <SectionHeader title="Avatars" subtitle="User profile images" />
          <Card>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Sizes</h4>
                  <div className="flex flex-wrap gap-4 items-end">
                    <Avatar src="https://i.pravatar.cc/150?img=1" alt="User 1" size="xs" />
                    <Avatar src="https://i.pravatar.cc/150?img=2" alt="User 2" size="sm" />
                    <Avatar src="https://i.pravatar.cc/150?img=3" alt="User 3" size="md" />
                    <Avatar src="https://i.pravatar.cc/150?img=4" alt="User 4" size="lg" />
                    <Avatar src="https://i.pravatar.cc/150?img=5" alt="User 5" size="xl" />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Status Indicators</h4>
                  <div className="flex flex-wrap gap-4">
                    <Avatar src="https://i.pravatar.cc/150?img=6" alt="Online" size="lg" online />
                    <Avatar src="https://i.pravatar.cc/150?img=7" alt="Offline" size="lg" offline />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Fallback & Groups</h4>
                  <div className="space-y-3">
                    <Avatar alt="John Doe" size="lg" fallback="JD" />
                    <AvatarGroup>
                      <Avatar src="https://i.pravatar.cc/150?img=8" alt="User 8" size="md" />
                      <Avatar src="https://i.pravatar.cc/150?img=9" alt="User 9" size="md" />
                      <Avatar src="https://i.pravatar.cc/150?img=10" alt="User 10" size="md" />
                      <Avatar alt="+5" size="md" fallback="+5" />
                    </AvatarGroup>
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Section>

        {/* Stats */}
        <Section>
          <SectionHeader title="Stats" subtitle="Numerical data display" />
          <div className="space-y-4">
            <StatsContainer>
              <Stat title="Total Users" value="89,400" description="↗︎ 400 (22%)" />
              <Stat title="Page Views" value="4,200" description="↘︎ 90 (14%)" />
              <Stat title="New Signups" value="1,200" description="↗︎ 100 (8.3%)" />
            </StatsContainer>

            <StatsContainer>
              <Stat title="Followers" value="2,500" icon={<UserIcon className="w-8 h-8" />} trend="up" />
              <Stat title="Engagement" value="86%" icon={<HeartIcon className="w-8 h-8" />} trend="up" />
            </StatsContainer>
          </div>
        </Section>

        {/* Loading States */}
        <Section>
          <SectionHeader title="Loading States" subtitle="Progress indicators" />
          <Card>
            <CardBody>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Variants</h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Loading variant="spinner" />
                    <Loading variant="dots" />
                    <Loading variant="ring" />
                    <Loading variant="ball" />
                    <Loading variant="bars" />
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">Sizes</h4>
                  <div className="flex flex-wrap gap-4 items-center">
                    <Loading size="xs" />
                    <Loading size="sm" />
                    <Loading size="md" />
                    <Loading size="lg" />
                  </div>
                </div>
              </div>
            </CardBody>
          </Card>
        </Section>

        {/* Color Palette */}
        <Section>
          <SectionHeader title="Color Palette" subtitle="Theme colors from DaisyUI" />
          <Card>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="h-20 bg-primary rounded-lg mb-2"></div>
                  <p className="text-sm font-semibold">Primary</p>
                </div>
                <div>
                  <div className="h-20 bg-secondary rounded-lg mb-2"></div>
                  <p className="text-sm font-semibold">Secondary</p>
                </div>
                <div>
                  <div className="h-20 bg-accent rounded-lg mb-2"></div>
                  <p className="text-sm font-semibold">Accent</p>
                </div>
                <div>
                  <div className="h-20 bg-neutral rounded-lg mb-2"></div>
                  <p className="text-sm font-semibold">Neutral</p>
                </div>
                <div>
                  <div className="h-20 bg-base-100 border-2 border-base-300 rounded-lg mb-2"></div>
                  <p className="text-sm font-semibold">Base 100</p>
                </div>
                <div>
                  <div className="h-20 bg-base-200 rounded-lg mb-2"></div>
                  <p className="text-sm font-semibold">Base 200</p>
                </div>
                <div>
                  <div className="h-20 bg-base-300 rounded-lg mb-2"></div>
                  <p className="text-sm font-semibold">Base 300</p>
                </div>
                <div>
                  <div className="h-20 bg-info rounded-lg mb-2"></div>
                  <p className="text-sm font-semibold">Info</p>
                </div>
                <div>
                  <div className="h-20 bg-success rounded-lg mb-2"></div>
                  <p className="text-sm font-semibold">Success</p>
                </div>
                <div>
                  <div className="h-20 bg-warning rounded-lg mb-2"></div>
                  <p className="text-sm font-semibold">Warning</p>
                </div>
                <div>
                  <div className="h-20 bg-error rounded-lg mb-2"></div>
                  <p className="text-sm font-semibold">Error</p>
                </div>
              </div>
            </CardBody>
          </Card>
        </Section>

        {/* Example: User Profile Card */}
        <Section>
          <SectionHeader title="Example: User Profile Card" subtitle="Combining components" />
          <Card variant="base" hover className="max-w-md mx-auto">
            <CardBody>
              <div className="flex items-start gap-4">
                <Avatar src="https://i.pravatar.cc/150?img=11" alt="Sarah Johnson" size="lg" online />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold">Sarah Johnson</h3>
                    <Badge variant="success" size="sm" className="gap-1">
                      <CheckCircleIcon className="w-3 h-3" />
                      Verified
                    </Badge>
                  </div>
                  <p className="text-sm text-base-content/70">@sarahj</p>
                  <p className="text-xs text-base-content/50 mt-1">FID: 123456</p>
                </div>
              </div>

              <p className="mt-4 text-sm">
                Building cool stuff on Farcaster 🚀 | Web3 enthusiast | Designer & Developer
              </p>

              <StatsContainer className="mt-4 w-full">
                <Stat title="Followers" value="2.5K" />
                <Stat title="Following" value="890" />
              </StatsContainer>

              <div className="flex gap-2 mt-4">
                <Button variant="primary" size="sm" fullWidth>
                  Follow
                </Button>
                <Button variant="outline" size="sm">
                  Message
                </Button>
              </div>
            </CardBody>
          </Card>
        </Section>

        {/* Arrows */}
        <Section>
          <SectionHeader title="Arrows" subtitle="Available arrows" />
          <Card variant="base" hover className="max-w-md mx-auto">
            <CardBody>
              <div className="flex flex-wrap gap-2">
                <ArrowTrendingUpIcon className="w-6 h-6" />
                <ArrowTrendingDownIcon className="w-6 h-6" />
              </div>
            </CardBody>
          </Card>
        </Section>
      </div>
    </div>
  );
}
