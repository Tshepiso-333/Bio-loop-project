import React from 'react';
import { useProfile } from '../hooks/useProfile';
import { RestaurantProvider } from '../contexts/RestaurantContext';
import AdminStack from '../../navigation/AdminStack';
import DriverStack from '../../navigation/DriverStack';
import ManufacturerStack from '../../navigation/ManufacturerStack';
import RestaurantStack from '../../navigation/RestaurantStack';
import { CollectorProvider } from '../contexts/CollectorContext';
import { ManufacturerProvider } from '../contexts/ManufacturerContext';

function RestaurantArea() {
  return (
    <RestaurantProvider>
      <RestaurantStack />
    </RestaurantProvider>
  );
}

function CollectorArea() {
  return (
    <CollectorProvider>
      <DriverStack />
    </CollectorProvider>
  );
}

function ManufacturerArea() {
  return (
    <ManufacturerProvider>
      <ManufacturerStack />
    </ManufacturerProvider>
  );
}

const ROLE_AREAS = {
  restaurant: RestaurantArea,
  collector: CollectorArea,
  manufacturer: ManufacturerArea,
  admin: AdminStack,
};

/**
 * Mounts the correct navigation stack for the authenticated user's role.
 * Role-specific data providers wrap their stack here when implemented.
 */
export default function RoleProviderGate() {
  const { role } = useProfile();
  const ActiveArea = ROLE_AREAS[role];

  if (!ActiveArea) {
    return null;
  }

  return <ActiveArea />;
}

export { ROLE_AREAS as ROLE_STACKS };
