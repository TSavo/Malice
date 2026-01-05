// Underground passage - connecting to Abandoned Bank Vault (10,-4)

export const room = {
  name: 'Vault Approach',
  description: `The passage approaches the Abandoned Bank Vault, the construction showing the heavy security measures of a bygone era. The walls are reinforced with steel plates—not utility infrastructure but deliberate fortification, designed to protect whatever was stored in the vault beyond.

The floor is made of thick concrete, cracked now but once solid enough to discourage tunneling. The bank's security extended into the underground, the builders aware that the greatest threat might come from below.

A heavy steel door frame marks the boundary of the vault's outer defenses, though the door itself has been removed.`,
  x: 9,
  y: -4,
  z: -2,
  population: 0,
  ambientNoise: 10,
  lighting: 12,
  waterLevel: 8,
  outdoor: false,
  exits: {
    north: {
      to: 'underground/upper-tunnels/x9-y-3.ts',
      description: 'The passage leads north',
    },
    east: {
      to: 'buildings/southeast-underground/z-2.ts',
      room: '%BANK_VAULT',
      description: 'The passage leads east to Abandoned Bank Vault',
    },
  },
};
