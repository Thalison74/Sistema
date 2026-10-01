//! Centralized financial math. All monetary values are integer cents.
//! Keeping every calculation here avoids duplicating logic across commands.

use crate::models::{Account, ChartPoint, Session, SessionStats};

/// resultadoConta = saldoFinal - saldoInicial. `None` while the account is pending.
pub fn account_result_cents(initial: i64, final_balance: Option<i64>) -> Option<i64> {
    final_balance.map(|f| f - initial)
}

/// resultadoSessao = soma dos resultados das contas já finalizadas.
pub fn session_result_cents(accounts: &[Account]) -> i64 {
    accounts.iter().filter_map(|a| a.result_cents).sum()
}

pub fn session_profit_cents(accounts: &[Account]) -> i64 {
    accounts
        .iter()
        .filter_map(|a| a.result_cents)
        .filter(|r| *r > 0)
        .sum()
}

pub fn session_loss_cents(accounts: &[Account]) -> i64 {
    accounts
        .iter()
        .filter_map(|a| a.result_cents)
        .filter(|r| *r < 0)
        .sum()
}

pub fn session_has_pending(accounts: &[Account]) -> bool {
    accounts.iter().any(|a| a.final_balance_cents.is_none())
}

/// resultadoGeral = soma dos resultados das sessões, in chronological order,
/// plus the running cumulative value used by the dashboard chart.
pub fn build_chart(sessions: &[(Session, i64)]) -> Vec<ChartPoint> {
    let mut cumulative = 0i64;
    sessions
        .iter()
        .map(|(session, result_cents)| {
            cumulative += result_cents;
            ChartPoint {
                session_id: session.id,
                name: session.name.clone(),
                date: session.session_date.clone(),
                result_cents: *result_cents,
                cumulative_cents: cumulative,
            }
        })
        .collect()
}

pub fn build_stats(chart: &[ChartPoint]) -> SessionStats {
    let best_session = chart.iter().max_by_key(|p| p.result_cents).cloned();
    let worst_session = chart.iter().min_by_key(|p| p.result_cents).cloned();
    let positive_count = chart.iter().filter(|p| p.result_cents > 0).count() as i64;
    let negative_count = chart.iter().filter(|p| p.result_cents < 0).count() as i64;
    let accumulated_cents = chart.last().map(|p| p.cumulative_cents).unwrap_or(0);
    let average_cents = if chart.is_empty() {
        0
    } else {
        accumulated_cents / chart.len() as i64
    };

    SessionStats {
        best_session,
        worst_session,
        average_cents,
        positive_count,
        negative_count,
        accumulated_cents,
    }
}
