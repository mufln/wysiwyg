import sympy
from sympy import simplify, expand
from sympy.parsing.latex import parse_latex
import difflib as df


def latex_to_array(array: list, index: int = 0):
    if array[index] is not None and len(array[index].args) >= 2:
        current_expression = array[index]
        del array[index]

        for arg_index in range(len(current_expression.args) - 1, 0, -1):
            array.insert(index, current_expression.args[arg_index])
            latex_to_array(array, index)
            array.insert(index, current_expression.func)

        array.insert(index, current_expression.args[0])
        latex_to_array(array, index)

    elif array[index] is not None and len(array[index].args) == 1:
        array.insert(index, array[index].args[0])
        index += 1
        array[index] = array[index].func
        latex_to_array(array, index - 1)


def indexing_and_stringify(array: list):
    replacements = dict()
    for i in range(len(array)):
        if type(array[i]) == sympy.core.symbol.Symbol:
            if (str(array[i]) not in replacements) and (not str(array[i]).isdigit()):
                replacements[str(array[i])] = "x" + str(len(replacements))
            array[i] = replacements[str(array[i])]
        else:
            array[i] = str(array[i])


def percent(latex1, latex2):
    l1 = [expand(simplify(parse_latex(latex1)))]
    l2 = [expand(simplify(parse_latex(latex2)))]
    latex_to_array(l1, 0)
    latex_to_array(l2, 0)
    indexing_and_stringify(l1)
    indexing_and_stringify(l2)

    s = df.SequenceMatcher(None, l1, l2)
    result = s.get_matching_blocks()
    result = result[:(len(result) - 1)]
    result = [[match.a, match.b, match.size] for match in sorted(result, key=lambda x: x.size, reverse=True)]
    count_match_size = 0
    for i in result:
        count_match_size += i[2]
    result_persentage = count_match_size / max(len(l1), len(l2)) * 100

    return result_persentage
