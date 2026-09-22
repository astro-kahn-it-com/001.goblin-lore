export type OverrideClassification =
  | 'OVERRIDE_INTENTIONAL' // Valid rule; author intentionally overrides for dramatic irony
  | 'OVERRIDE_FALSE_POSITIVE' // Defective rule; false positive due to parser/context limitation

export interface RuleTelemetryRecord {
  rule_id: string
  timestamp: string
  source_file: string
  line_coordinate: number
  offending_text: string
  classification: OverrideClassification
  author_notes?: string
}

export interface RuleStatusSummary {
  rule_id: string
  total_evaluations: number
  total_overrides: number
  intentional_overrides: number
  false_positives: number
  friction_density: number
  defect_ratio: number
  is_quarantined: boolean
  status: 'STABLE' | 'HIGH_FRICTION' | 'QUARANTINED'
}

export class AuteurTelemetryEngine {
  private records: RuleTelemetryRecord[] = []
  private ruleEvaluationCounts: Record<string, number> = {}

  public registerEvaluation(ruleId: string): void {
    this.ruleEvaluationCounts[ruleId] =
      (this.ruleEvaluationCounts[ruleId] || 0) + 1
  }

  public recordOverride(record: RuleTelemetryRecord): void {
    this.records.push(record)
  }

  public getRuleSummary(ruleId: string): RuleStatusSummary {
    const totalEvals = this.ruleEvaluationCounts[ruleId] || 0
    const ruleRecords = this.records.filter((r) => r.rule_id === ruleId)
    const intentional = ruleRecords.filter(
      (r) => r.classification === 'OVERRIDE_INTENTIONAL',
    ).length
    const falsePositives = ruleRecords.filter(
      (r) => r.classification === 'OVERRIDE_FALSE_POSITIVE',
    ).length
    const totalOverrides = intentional + falsePositives

    const frictionDensity = totalEvals > 0 ? totalOverrides / totalEvals : 0
    const defectRatio = totalOverrides > 0 ? falsePositives / totalOverrides : 0

    const isQuarantined = totalOverrides >= 30 && defectRatio > 0.25
    let status: 'STABLE' | 'HIGH_FRICTION' | 'QUARANTINED' = 'STABLE'

    if (isQuarantined) {
      status = 'QUARANTINED'
    } else if (totalEvals >= 50 && frictionDensity > 0.15) {
      status = 'HIGH_FRICTION'
    }

    return {
      rule_id: ruleId,
      total_evaluations: totalEvals,
      total_overrides: totalOverrides,
      intentional_overrides: intentional,
      false_positives: falsePositives,
      friction_density: Math.round(frictionDensity * 1000) / 1000,
      defect_ratio: Math.round(defectRatio * 1000) / 1000,
      is_quarantined: isQuarantined,
      status,
    }
  }
}
